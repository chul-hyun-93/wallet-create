import * as bip39 from "./bip0039";
import * as bip32 from "./bip0032";
import * as blockchain from "./blockchain";

(async () => {
  // 1. 니모닉 문구 생성
  const mnemonic = await bip39.generateMnemonic(256);
  console.log("Generated Mnemonic:", mnemonic);

  // 2. 니모닉 문구로부터 시드 생성
  const seed = await bip39.mnemonicToSeed(mnemonic);
  console.log("Generated Seed:", seed.toString("hex"));

  // 3. 시드로부터 마스터 키 생성
  const root = bip32.fromSeed(seed);
  const rootPrivateKey = root.privateKey;
  const rootChainCode = root.chainCode;

  generateBitcoinAddress(rootPrivateKey, rootChainCode, "m/44'/0'/0'/0/0");
  generateBitcoinAddress(rootPrivateKey, rootChainCode, "m/44'/0'/0'/0/1");
  generateBitcoinAddress(rootPrivateKey, rootChainCode, "m/44'/0'/0'/0/2");
  generateBitcoinAddress(rootPrivateKey, rootChainCode, "m/44'/0'/1'/0/0");
  generateBitcoinAddress(rootPrivateKey, rootChainCode, "m/44'/0'/1'/0/1");
  // generateBitcoinAddress(seed, "m/84'/0'/0'/0/0");
})();

function generateBitcoinAddress(
  rootPrivateKey: Buffer,
  rootChainCode: Buffer,
  path: string,
) {
  // 4. HD Wallet 을 이용하여 비트코인 주소 생성

  const child = bip32.deriveKeyFromPath(rootPrivateKey, rootChainCode, path);
  console.log({
    path,
    privateKey: child.privateKey.toString("hex"),
    publicKey: child.publicKey.toString("hex"),
    bitcoinAddress: blockchain.generateBitcoinAddress(child.publicKey),
  });
}
