import { concatUint8Arrays, encodeLatin1 } from "./utils.js";

export async function loadICCProfileBytes(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`ICCが見つかりません: ${path}`);
  }
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes.length === 0) {
    throw new Error("ICCファイルが空です");
  }
  return bytes;
}

async function deflateBytes(bytes) {
  if (typeof CompressionStream === "undefined") {
    throw new Error("CompressionStreamが使用できません");
  }
  const stream = new CompressionStream("deflate");
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const res = new Response(stream.readable);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function buildICCPChunkData(profileName, iccBytes) {
  const nameBytes = encodeLatin1(profileName);
  if (nameBytes.length < 1 || nameBytes.length > 79) {
    throw new Error("ICCプロファイル名が不正です（1-79文字）");
  }
  for (const b of nameBytes) {
    if (b === 0) {
      throw new Error("ICCプロファイル名にNULLは使えません");
    }
  }
  const compressed = await deflateBytes(iccBytes);
  return concatUint8Arrays(nameBytes, new Uint8Array([0x00, 0x00]), compressed);
}
