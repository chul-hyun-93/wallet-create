import * as secp256k1 from "secp256k1";
import * as blockchain from "./blockchain";

const HARDENED_INDEX_OFFSET = 0b1000_0000_0000_0000_0000_0000_0000_0000;

interface Bip32KeyPair {
  privateKey: Buffer;
  chainCode: Buffer;
  publicKey: Buffer;
}

export const fromSeed = (seed: Buffer): Bip32KeyPair => {
  const I = blockchain.hmacSha512(Buffer.from("Bitcoin seed"), seed);
  const privateKey = I.slice(0, 32);
  const chainCode = I.slice(32);
  const publicKey = blockchain.getPublicKeyFromPrivateKey(privateKey);

  return { privateKey, chainCode, publicKey };
};

export const deriveKeyFromPath = (
  rootPrivateKey: Buffer,
  rootChainCode: Buffer,
  path: string,
): Bip32KeyPair => {
  const indexes = parsePath(path);

  let parentPrivateKey = Buffer.from(rootPrivateKey);
  let parentChainCode = Buffer.from(rootChainCode);
  let parentPublicKey = blockchain.getPublicKeyFromPrivateKey(parentPrivateKey);

  for (const index of indexes) {
    let result;
    if (index >= HARDENED_INDEX_OFFSET) {
      result = deriveHardenedChildKey({
        parentPrivateKey,
        parentPublicKey,
        parentChainCode,
        index,
      });
    } else {
      result = deriveChildKey({
        parentPrivateKey,
        parentPublicKey,
        parentChainCode,
        index,
      });
    }
    parentPrivateKey = result.privateKey;
    parentChainCode = result.chainCode;
    parentPublicKey = result.publicKey;
  }

  return {
    privateKey: parentPrivateKey,
    chainCode: parentChainCode,
    publicKey: parentPublicKey,
  };
};

export const deriveKeyFromPathWithoutPrivateKey = (
  publicKey: Buffer,
  chainCode: Buffer,
  path: string,
): Omit<Bip32KeyPair, "privateKey"> => {
  const indexes = parsePath(path);

  let parentChainCode = Buffer.from(chainCode);
  let parentPublicKey = publicKey;

  for (const index of indexes) {
    let result;
    if (index >= HARDENED_INDEX_OFFSET) {
      throw new Error("Hardened child key derivation is not supported");
    } else {
      result = deriveChildKeyWithoutPrivateKey({
        parentPublicKey,
        parentChainCode,
        index,
      });
    }
    parentChainCode = result.chainCode;
    parentPublicKey = result.publicKey;
  }

  return {
    chainCode: parentChainCode,
    publicKey: parentPublicKey,
  };
};

function parsePath(path: string): number[] {
  return path
    .split("/")
    .slice(1)
    .map((level) => {
      if (level.endsWith("'")) {
        return parseInt(level.slice(0, -1), 10) + HARDENED_INDEX_OFFSET; // 하드닝된 인덱스
      }
      return parseInt(level, 10);
    });
}

function deriveHardenedChildKey({
  parentPrivateKey,
  parentPublicKey,
  parentChainCode,
  index,
}: {
  parentPrivateKey: Buffer;
  parentPublicKey: Buffer;
  parentChainCode: Buffer;
  index: number;
}): Bip32KeyPair {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32BE(index, 0);

  // 부모 개인 키 앞에 0x00 바이트를 추가
  const data = Buffer.concat([
    Buffer.from([0x00]),
    parentPrivateKey,
    indexBuffer,
  ]);
  const I = blockchain.hmacSha512(parentChainCode, data);

  const IL = I.slice(0, 32);
  const chainCode = I.slice(32);

  // 타원 곡선 연산을 통해 자식 키 계산
  const privateKey = Buffer.from(
    secp256k1.privateKeyTweakAdd(parentPrivateKey, IL),
  );

  // const publicKey = blockchain.getPublicKeyFromPrivateKey(privateKey);
  const publicKey = Buffer.from(
    secp256k1.publicKeyTweakAdd(parentPublicKey, IL, true),
  );

  return { publicKey, privateKey, chainCode };
}

function deriveChildKey({
  parentPrivateKey,
  parentPublicKey,
  parentChainCode,
  index,
}: {
  parentPrivateKey: Buffer;
  parentPublicKey: Buffer;
  parentChainCode: Buffer;
  index: number;
}): Bip32KeyPair {
  const keypair = deriveChildKeyWithoutPrivateKey({
    parentPrivateKey,
    parentPublicKey,
    parentChainCode,
    index,
  });

  return keypair as Bip32KeyPair;
}

function deriveChildKeyWithoutPrivateKey({
  parentPrivateKey,
  parentPublicKey,
  parentChainCode,
  index,
}: {
  parentPrivateKey?: Buffer;
  parentPublicKey: Buffer;
  parentChainCode: Buffer;
  index: number;
}): Omit<Bip32KeyPair, "privateKey"> & { privateKey: Buffer | null } {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32BE(index, 0);

  const data = Buffer.concat([parentPublicKey, indexBuffer]);
  const I = blockchain.hmacSha512(parentChainCode, data);

  const IL = I.slice(0, 32);
  const chainCode = I.slice(32);

  const privateKey = (() => {
    if (!parentPrivateKey) return null;
    return Buffer.from(secp256k1.privateKeyTweakAdd(parentPrivateKey, IL));
  })();

  const publicKey = Buffer.from(
    secp256k1.publicKeyTweakAdd(parentPublicKey, IL, true),
  );

  return { publicKey, privateKey, chainCode };
}
