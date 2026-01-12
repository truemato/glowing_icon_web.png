import { concatUint8Arrays, crc32, readBlobAsArrayBuffer, u32be } from "./utils.js";

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function asciiBytes(str) {
  const out = new Uint8Array(4);
  for (let i = 0; i < 4; i += 1) {
    out[i] = str.charCodeAt(i) & 0xff;
  }
  return out;
}

function makeChunk(type, data) {
  const typeBytes = asciiBytes(type);
  const lengthBytes = u32be(data.length);
  const crcBytes = u32be(crc32(concatUint8Arrays(typeBytes, data)));
  return concatUint8Arrays(lengthBytes, typeBytes, data, crcBytes);
}

export async function insertICCPIntoPngBlob(rawPngBlob, iccpChunkData) {
  const buffer = await readBlobAsArrayBuffer(rawPngBlob);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error("PNG署名が不正です");
    }
  }

  let offset = PNG_SIGNATURE.length;
  const chunks = [];
  let ihdrIndex = null;

  while (offset + 8 <= bytes.length) {
    const length =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const chunkEnd = offset + 8 + length + 4;
    const chunkBytes = bytes.slice(offset, chunkEnd);

    if (type === "IHDR") {
      ihdrIndex = chunks.length;
      chunks.push(chunkBytes);
    } else if (type !== "iCCP") {
      chunks.push(chunkBytes);
    }
    offset = chunkEnd;
  }

  if (ihdrIndex === null) {
    throw new Error("IHDRチャンクが見つかりません");
  }

  const iccpChunk = makeChunk("iCCP", iccpChunkData);
  const rebuilt = [
    PNG_SIGNATURE,
    ...chunks.slice(0, ihdrIndex + 1),
    iccpChunk,
    ...chunks.slice(ihdrIndex + 1)
  ];
  const out = concatUint8Arrays(...rebuilt);
  return new Blob([out], { type: "image/png" });
}
