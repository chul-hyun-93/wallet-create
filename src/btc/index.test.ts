import * as bip39 from "./bip0039";
import * as bip32 from "./bip0032";
import * as blockchain from "./blockchain";

const testVectors = [
  {
    rootPrivateKey:
      "5aa893a5df933e17d11613310d9cd06d9b4dcb1472128979ec9377d03e9cfe6b",
    rootPublicKey:
      "02f2ae76a09d7659108d041b3fd39d459939e1595ec31f7a473d85ed15ef7f5508",
    mnemonic:
      "coral dwarf hidden repeat turtle ski bounce this solar round author exhibit",
    path: "m/44'/0'/0'/0/0",
    address: "19ttVzDq8dnJKhBiQhpVTpJs3UoBHPpsjh",
    publicKey:
      "02db7280c5e69d0e738339d6107fa5e6cf3a7ae2a85b4cd8c585d6853370720d23",
    privateKey:
      "5e03c33c444418713ceae0445f725333a1b2482f1565075b55f0870c02b9262b",
  },
] as const;

async function generateAddressAndPrivateKey(mnemonic: string, path: string) {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);
  const child = bip32.deriveKeyFromPath(root.privateKey, root.chainCode, path);

  return {
    rootPrivateKey: root.privateKey.toString("hex"),
    rootPublicKey: root.publicKey.toString("hex"),
    address: blockchain.generateBitcoinAddress(child.publicKey),
    publicKey: child.publicKey.toString("hex"),
    privateKey: child.privateKey.toString("hex"),
  };
}

describe("Bitcoin Address Generation", () => {
  testVectors.forEach(
    ({
      mnemonic,
      path,
      address,
      privateKey,
      rootPrivateKey,
      publicKey,
      rootPublicKey,
    }) => {
      test(`should generate correct address and private key for path ${path}`, async () => {
        const result = await generateAddressAndPrivateKey(mnemonic, path);
        expect(result).toStrictEqual({
          rootPrivateKey,
          rootPublicKey,
          address,
          privateKey,
          publicKey,
        });
      });
    },
  );
});
