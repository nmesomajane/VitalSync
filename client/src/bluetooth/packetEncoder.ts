
import { Buffer } from "buffer";
export const encodeTimestamp = (): Uint8Array => {
  const timestamp = Math.floor(Date.now() / 1000);


  const bytes = new Uint8Array(4);

  bytes[0] = timestamp & 0xFF;

  bytes[1] = (timestamp >> 8) & 0xFF;
  bytes[2] = (timestamp >> 16) & 0xFF;
  bytes[3] = (timestamp >> 24) & 0xFF;


  console.log(
    `packetEncoder: timestamp ${timestamp} encoded as`,
    Array.from(bytes).map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(" ")
  );

  return bytes;
};


export const toBase64 = (bytes: Uint8Array): string => {
  return Buffer.from(bytes).toString("base64");
};

export const encodeTimestampBase64 = (): string => {
  return toBase64(encodeTimestamp());
 
};