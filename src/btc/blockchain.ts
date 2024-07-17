import * as ecc from "tiny-secp256k1";

import crypto from "crypto";
import bs58 from "bs58";

export function getPublicKeyFromPrivateKey(
  privateKey: Buffer,
  compressed: boolean = true,
): Buffer {
  const result = ecc.pointFromScalar(privateKey, compressed);

  if (!result) {
    throw new Error("Invalid public key");
  }

  return Buffer.from(result);
}

export function generateBitcoinAddress(publicKey: Buffer): string {
  // Step 1: SHA-256 해시
  const sha256Hash = crypto.createHash("sha256").update(publicKey).digest();

  // Step 2: RIPEMD-160 해시
  const ripemd160Hash = crypto
    .createHash("ripemd160")
    .update(sha256Hash)
    .digest();

  // Step 3: 프리픽스 추가 (0x00 for mainnet)
  const prefix = Buffer.from([0x00]);
  const prefixedHash = Buffer.concat([prefix, ripemd160Hash]);

  // Step 4: 두 번의 SHA-256 해시를 통해 체크섬 생성
  const firstSha = crypto.createHash("sha256").update(prefixedHash).digest();
  const secondSha = crypto.createHash("sha256").update(firstSha).digest();
  const checksum = secondSha.slice(0, 4);

  // Step 5: 체크섬을 해시 값에 추가
  const finalHash = Buffer.concat([prefixedHash, checksum]);

  // Step 6: Base58Check 인코딩
  const address = bs58.encode(finalHash);

  return address;
}

export function hmacSha512(key: Buffer, data: Buffer): Buffer {
  return crypto.createHmac("sha512", key).update(data).digest();
}
