export const browserProjects = [
    'chromium-dpr1',
    'chromium-dpr2',
    'firefox-dpr1',
    'firefox-dpr2'
];

export const viewports = [
    { id: '1280x900', width: 1280, height: 900 },
    { id: '900x1280', width: 900, height: 1280 }
];

export const captureVariants = browserProjects.flatMap((project) => viewports.map((viewport) => ({
    id: `${project}-${viewport.id}`,
    project,
    viewport
})));
