import { readFile } from 'node:fs/promises';

function stripComments(source) {
    let output = '';
    let inString = false;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];
        if (inString) {
            output += char;
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
            continue;
        }
        if (char === '"') {
            inString = true;
            output += char;
        } else if (char === '/' && next === '/') {
            output += '  ';
            index += 1;
            while (index + 1 < source.length && source[index + 1] !== '\n' && source[index + 1] !== '\r') {
                output += ' ';
                index += 1;
            }
        } else if (char === '/' && next === '*') {
            output += '  ';
            index += 1;
            while (index + 1 < source.length && !(source[index + 1] === '*' && source[index + 2] === '/')) {
                output += source[index + 1] === '\n' || source[index + 1] === '\r' ? source[index + 1] : ' ';
                index += 1;
            }
            if (index + 2 < source.length) {
                output += '  ';
                index += 2;
            }
        } else {
            output += char;
        }
    }
    return output;
}

function stripTrailingCommas(source) {
    let output = '';
    let inString = false;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (inString) {
            output += char;
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
            continue;
        }
        if (char === '"') {
            inString = true;
            output += char;
        } else if (char === ',') {
            let next = index + 1;
            while (next < source.length && /\s/.test(source[next])) next += 1;
            if (source[next] === '}' || source[next] === ']') {
                output += ' ';
            } else {
                output += char;
            }
        } else {
            output += char;
        }
    }
    return output;
}

export function parseJsonc(source) {
    return JSON.parse(stripTrailingCommas(stripComments(source)));
}

export async function readJsonc(filePath) {
    return parseJsonc(await readFile(filePath, 'utf8'));
}
