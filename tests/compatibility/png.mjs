import { deflateSync, inflateSync } from 'node:zlib';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[index] = value >>> 0;
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const chunk = Buffer.alloc(12 + data.length);
    chunk.writeUInt32BE(data.length, 0);
    typeBuffer.copy(chunk, 4);
    data.copy(chunk, 8);
    chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
    return chunk;
}

export function encodeRgbaPng(width, height, rgba) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length !== width * height * 4) {
        throw new TypeError('PNG dimensions or RGBA data are invalid.');
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 6;
    header[10] = 0;
    header[11] = 0;
    header[12] = 0;
    const rowBytes = width * 4;
    const raw = Buffer.alloc(height * (rowBytes + 1));
    for (let row = 0; row < height; row += 1) {
        raw[row * (rowBytes + 1)] = 0;
        rgba.copy(raw, row * (rowBytes + 1) + 1, row * rowBytes, (row + 1) * rowBytes);
    }
    return Buffer.concat([
        signature,
        makeChunk('IHDR', header),
        makeChunk('IDAT', deflateSync(raw)),
        makeChunk('IEND', Buffer.alloc(0))
    ]);
}

function paeth(left, above, upperLeft) {
    const estimate = left + above - upperLeft;
    const leftDistance = Math.abs(estimate - left);
    const aboveDistance = Math.abs(estimate - above);
    const upperLeftDistance = Math.abs(estimate - upperLeft);
    if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
        return left;
    }
    return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

export function decodePng(png) {
    if (!Buffer.isBuffer(png) || png.length < 33 || !png.subarray(0, 8).equals(signature)) {
        throw new TypeError('Screenshot is not a valid PNG file.');
    }
    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    let interlace = 0;
    const imageData = [];
    while (offset + 12 <= png.length) {
        const length = png.readUInt32BE(offset);
        const type = png.toString('ascii', offset + 4, offset + 8);
        const data = png.subarray(offset + 8, offset + 8 + length);
        if (offset + 12 + length > png.length) {
            throw new TypeError('Screenshot PNG has a truncated chunk.');
        }
        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data[8];
            colorType = data[9];
            interlace = data[12];
        } else if (type === 'IDAT') {
            imageData.push(data);
        } else if (type === 'IEND') {
            break;
        }
        offset += length + 12;
    }
    if (!width || !height || bitDepth !== 8 || ![2, 6].includes(colorType) || interlace !== 0 || !imageData.length) {
        throw new TypeError('Screenshot PNG must use non-interlaced 8-bit RGB or RGBA data.');
    }
    const channels = colorType === 6 ? 4 : 3;
    const rowBytes = width * channels;
    const raw = inflateSync(Buffer.concat(imageData));
    if (raw.length !== height * (rowBytes + 1)) {
        throw new TypeError('Screenshot PNG data size does not match its dimensions.');
    }
    const decoded = Buffer.alloc(height * rowBytes);
    for (let row = 0; row < height; row += 1) {
        const inputOffset = row * (rowBytes + 1);
        const outputOffset = row * rowBytes;
        const filter = raw[inputOffset];
        for (let column = 0; column < rowBytes; column += 1) {
            const value = raw[inputOffset + 1 + column];
            const left = column >= channels ? decoded[outputOffset + column - channels] : 0;
            const above = row > 0 ? decoded[outputOffset + column - rowBytes] : 0;
            const upperLeft = row > 0 && column >= channels ? decoded[outputOffset + column - rowBytes - channels] : 0;
            let predictor = 0;
            if (filter === 1) predictor = left;
            else if (filter === 2) predictor = above;
            else if (filter === 3) predictor = Math.floor((left + above) / 2);
            else if (filter === 4) predictor = paeth(left, above, upperLeft);
            else if (filter !== 0) throw new TypeError(`Screenshot PNG uses unsupported filter ${filter}.`);
            decoded[outputOffset + column] = (value + predictor) & 0xff;
        }
    }
    const rgba = Buffer.alloc(width * height * 4);
    for (let pixel = 0; pixel < width * height; pixel += 1) {
        const source = pixel * channels;
        const target = pixel * 4;
        rgba[target] = decoded[source];
        rgba[target + 1] = decoded[source + 1];
        rgba[target + 2] = decoded[source + 2];
        rgba[target + 3] = channels === 4 ? decoded[source + 3] : 255;
    }
    return { width, height, rgba };
}

export function comparePngBuffers(referenceBuffer, actualBuffer) {
    const reference = decodePng(referenceBuffer);
    const actual = decodePng(actualBuffer);
    if (reference.width !== actual.width || reference.height !== actual.height) {
        return {
            equal: false,
            width: reference.width,
            height: reference.height,
            actualWidth: actual.width,
            actualHeight: actual.height,
            differingPixels: null,
            differenceBounds: null,
            differencePng: null
        };
    }
    const output = Buffer.alloc(reference.rgba.length);
    let differingPixels = 0;
    let minX = reference.width;
    let minY = reference.height;
    let maxX = -1;
    let maxY = -1;
    for (let pixel = 0; pixel < reference.width * reference.height; pixel += 1) {
        const offset = pixel * 4;
        const changed = reference.rgba[offset] !== actual.rgba[offset]
            || reference.rgba[offset + 1] !== actual.rgba[offset + 1]
            || reference.rgba[offset + 2] !== actual.rgba[offset + 2]
            || reference.rgba[offset + 3] !== actual.rgba[offset + 3];
        if (changed) {
            differingPixels += 1;
            const x = pixel % reference.width;
            const y = Math.floor(pixel / reference.width);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            output[offset] = 255;
            output[offset + 1] = 0;
            output[offset + 2] = 0;
            output[offset + 3] = 255;
        } else {
            output[offset] = reference.rgba[offset];
            output[offset + 1] = reference.rgba[offset + 1];
            output[offset + 2] = reference.rgba[offset + 2];
            output[offset + 3] = 100;
        }
    }
    return {
        equal: differingPixels === 0,
        width: reference.width,
        height: reference.height,
        differingPixels,
        differenceBounds: differingPixels ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
        differencePng: encodeRgbaPng(reference.width, reference.height, output)
    };
}
