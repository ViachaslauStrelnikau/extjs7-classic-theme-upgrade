param(
    [Parameter(Mandatory = $true)]
    [string] $RunId
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$' -or $RunId.Contains('..')) {
    throw 'RunId must be a safe identifier without path separators or traversal.'
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$testApp = Join-Path $repositoryRoot 'TestApp'
$senchaCmd = Join-Path $repositoryRoot 'node_modules/@sencha/cmd-windows/dist/sencha.exe'
$artifactRoot = Join-Path $repositoryRoot "artifacts/compatibility/selection/$RunId"
$appJsonPath = Join-Path $testApp 'app.json'

if (-not (Test-Path -LiteralPath $senchaCmd -PathType Leaf)) {
    throw "Sencha Cmd is not installed at the expected path: $senchaCmd"
}
if (Test-Path -LiteralPath $artifactRoot) {
    throw "Selection evidence already exists. Use a new RunId: $RunId"
}

New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
$originalAppJson = [System.IO.File]::ReadAllBytes($appJsonPath)
$originalAppHash = (Get-FileHash -LiteralPath $appJsonPath -Algorithm SHA256).Hash.ToLowerInvariant()
$originalText = [System.Text.Encoding]::UTF8.GetString($originalAppJson)
$oldTheme = '"theme": "ext-theme-classic"'
$newTheme = '"theme": "theme-classic-modern"'
if (($originalText.Split($oldTheme).Length - 1) -ne 1) {
    throw 'TestApp/app.json must contain one ext-theme-classic theme setting.'
}

$sourcePaths = @(
    'app.js',
    'app/view/main/Main.js',
    'app/view/compatibility/Controls.js',
    'app/view/compatibility/DataViews.js',
    'app/view/compatibility/FixtureData.js',
    'app/view/compatibility/FormsAndFloats.js',
    'resources/css/compatibility-legacy.css',
    'packages/local/theme-classic-modern/package.json'
)

function Get-SourceHashes {
    $hashes = [ordered]@{}
    foreach ($relativePath in $sourcePaths) {
        $filePath = Join-Path $testApp $relativePath
        $key = "TestApp/$($relativePath.Replace([string][char]92, '/'))"
        $hashes[$key] = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    return $hashes
}

function Get-FixtureHash($hashes) {
    $keys = @($hashes.Keys | Where-Object {
        $_ -like 'TestApp/app/view/compatibility/*' -or $_ -eq 'TestApp/resources/css/compatibility-legacy.css'
    } | Sort-Object)
    $content = ($keys | ForEach-Object { "$_=$($hashes[$_])" }) -join "`n"
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($content)
    return [Convert]::ToHexString($sha.ComputeHash($bytes)).ToLowerInvariant()
}

function Invoke-Sencha($arguments, $logPath) {
    & $senchaCmd @arguments *>> $logPath
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        throw "Sencha Cmd failed with exit code $code. See $logPath"
    }
    return $code
}

function Get-ResolvedThemePackageName($builtApp, $selectedTheme) {
    $includedPackages = @($builtApp.packages.PSObject.Properties.Name)
    if ($includedPackages -contains $selectedTheme) {
        return $selectedTheme
    }

    $sdkThemeRoot = Join-Path $testApp 'ext/classic'
    foreach ($packageFile in (Get-ChildItem -LiteralPath $sdkThemeRoot -Filter 'package.json' -File -Recurse)) {
        $package = Get-Content -LiteralPath $packageFile.FullName -Raw | ConvertFrom-Json
        $packageName = $package.sencha.name
        if ($packageName -and @($package.sencha.alternateName) -contains $selectedTheme -and $includedPackages -contains $packageName) {
            return $packageName
        }
    }

    throw "The generated build manifest does not resolve theme '$selectedTheme' to an included package."
}

function Get-ResolvedThemeChain($builtApp, $selectedTheme) {
    $packageName = Get-ResolvedThemePackageName $builtApp $selectedTheme
    $chain = [System.Collections.Generic.List[string]]::new()
    $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)

    while ($packageName) {
        if (-not $seen.Add($packageName)) {
            throw "The generated theme package graph contains a cycle at '$packageName'."
        }

        $packageProperty = $builtApp.packages.PSObject.Properties[$packageName]
        if (-not $packageProperty) {
            throw "The generated build manifest omits parent package '$packageName'."
        }

        $chain.Add($packageName)
        $packageName = $packageProperty.Value.extend
    }

    return $chain.ToArray()
}

function Save-BuildManifest($role, $mode, $selectedTheme, $sourceHashes, $fixtureHash, $logPath) {
    $outputRoot = Join-Path $testApp "build/$mode/TestApp"
    $builtApp = Get-Content (Join-Path $outputRoot 'app.json') -Raw | ConvertFrom-Json
    if ($builtApp.theme -ne $selectedTheme) {
        throw "Output theme identity does not match $role/$mode."
    }

    $parentChain = @(Get-ResolvedThemeChain $builtApp $selectedTheme)
    $expectedParentChain = if ($role -eq 'derived') {
        @('theme-classic-modern', 'theme-classic', 'theme-neutral', 'theme-base')
    } else {
        @('theme-classic', 'theme-neutral', 'theme-base')
    }
    if (($parentChain -join '|') -ne ($expectedParentChain -join '|')) {
        throw "Resolved theme chain for $role/$mode does not match the verified demo chain: $($parentChain -join ' -> ')"
    }

    $outputHashes = [ordered]@{}
    foreach ($file in (Get-ChildItem -LiteralPath $outputRoot -File -Recurse | Sort-Object FullName)) {
        $relative = $file.FullName.Substring($outputRoot.Length + 1).Replace([string][char]92, '/')
        $outputHashes[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }

    $packageName = $parentChain[0]
    $packageVersion = $builtApp.packages.PSObject.Properties[$packageName].Value.version
    $manifest = [ordered]@{
        schemaVersion = 1
        buildId = "selection-$RunId-$role-$mode"
        themeRole = $role
        selectedTheme = $selectedTheme
        packageName = $packageName
        packageVersion = $packageVersion
        parentChain = $parentChain
        parentChainSource = 'Generated build app.json packages metadata'
        sourceHashes = $sourceHashes
        fixtureHash = $fixtureHash
        inputSetId = 'production-inputs-missing'
        buildMode = $mode
        command = "sencha app build $mode"
        exitCode = 0
        logPath = [System.IO.Path]::GetRelativePath($repositoryRoot, $logPath).Replace([string][char]92, '/')
        outputHashes = $outputHashes
        authoredPaintRules = $false
        replacementAssets = @()
    }
    $roleRoot = Join-Path $artifactRoot "$mode/$role"
    New-Item -ItemType Directory -Path $roleRoot -Force | Out-Null
    $manifest | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $roleRoot 'manifest.json') -Encoding utf8

    return [pscustomobject]@{
        role = $role
        buildMode = $mode
        selectedTheme = $selectedTheme
        exitCode = 0
        outputRoot = [System.IO.Path]::GetRelativePath($repositoryRoot, $outputRoot).Replace([string][char]92, '/')
        logPath = [System.IO.Path]::GetRelativePath($repositoryRoot, $logPath).Replace([string][char]92, '/')
        manifestPath = [System.IO.Path]::GetRelativePath($repositoryRoot, (Join-Path $roleRoot 'manifest.json')).Replace([string][char]92, '/')
        outputHashCount = $outputHashes.Count
    }
}

$initialSourceHashes = Get-SourceHashes
$fixtureHash = Get-FixtureHash $initialSourceHashes
$builds = @()
$replacementRefreshExitCode = $null
$rollbackRefreshExitCode = $null

try {
    $selectedText = $originalText.Replace($oldTheme, $newTheme)
    [System.IO.File]::WriteAllBytes($appJsonPath, [System.Text.UTF8Encoding]::new($false).GetBytes($selectedText))
    Set-Location $testApp

    $replacementRefreshLog = Join-Path $artifactRoot 'replacement-refresh.log'
    $replacementRefreshExitCode = Invoke-Sencha @('app', 'refresh') $replacementRefreshLog
    foreach ($mode in @('development', 'production')) {
        $logPath = Join-Path $artifactRoot "replacement-build-$mode.log"
        Invoke-Sencha @('app', 'build', $mode) $logPath | Out-Null
        $builds += Save-BuildManifest 'derived' $mode 'theme-classic-modern' $initialSourceHashes $fixtureHash $logPath
    }
} finally {
    [System.IO.File]::WriteAllBytes($appJsonPath, $originalAppJson)
}

Set-Location $testApp
$rollbackRefreshLog = Join-Path $artifactRoot 'rollback-refresh.log'
$rollbackRefreshExitCode = Invoke-Sencha @('app', 'refresh') $rollbackRefreshLog
foreach ($mode in @('development', 'production')) {
    $logPath = Join-Path $artifactRoot "rollback-build-$mode.log"
    Invoke-Sencha @('app', 'build', $mode) $logPath | Out-Null
    $builds += Save-BuildManifest 'rollback' $mode 'ext-theme-classic' $initialSourceHashes $fixtureHash $logPath
}

$finalAppHash = (Get-FileHash -LiteralPath $appJsonPath -Algorithm SHA256).Hash.ToLowerInvariant()
$finalSourceHashes = Get-SourceHashes
$sourceHashDifferences = @($initialSourceHashes.Keys | Where-Object { $initialSourceHashes[$_] -ne $finalSourceHashes[$_] })
$finalText = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($appJsonPath))
if ($finalAppHash -ne $originalAppHash -or -not $finalText.Contains($oldTheme) -or $sourceHashDifferences.Count -gt 0) {
    throw 'The original theme setting or source hashes did not restore.'
}

$result = [ordered]@{
    schemaVersion = 1
    runId = $RunId
    originalTheme = 'ext-theme-classic'
    replacementTheme = 'theme-classic-modern'
    replacementRefreshExitCode = $replacementRefreshExitCode
    rollbackRefreshExitCode = $rollbackRefreshExitCode
    replacementBuilds = @($builds | Where-Object role -eq 'derived')
    rollbackBuilds = @($builds | Where-Object role -eq 'rollback')
    finalTheme = 'ext-theme-classic'
    originalAppJsonSha256 = $originalAppHash
    finalAppJsonSha256 = $finalAppHash
    sourceHashes = $finalSourceHashes
    sourceHashDifferences = $sourceHashDifferences
    fixtureHash = $fixtureHash
    status = 'build-and-rollback-verified'
    runtimeStatus = 'not-verified'
}
$result | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $artifactRoot 'results.json') -Encoding utf8
Write-Output "Selection and rollback builds passed. Theme configuration and source hashes were restored. Evidence: $artifactRoot"
