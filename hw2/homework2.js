function generateAndDeriveWallet() {
  try {
    // 1. Generate Random Mnemonic using ethers.js
    const randomWallet = ethers.Wallet.createRandom();
    const mnemonic = randomWallet.mnemonic.phrase;
    
    document.getElementById('mnemonicInput').value = mnemonic;
    
    deriveFromMnemonic(mnemonic);
  } catch (error) {
    console.error("Error generating wallet:", error);
  }
}

function deriveFromMnemonic(mnemonic) {
  try {
    const path = document.getElementById('pathInput').value.trim() || "m/44'/60'/0'/0/0";

    // 1. BIP-39 Seed
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    const masterSeed = hdNode.seed;
    document.getElementById('outSeed').innerText = masterSeed;

    // 2. BIP-32 / BIP-44 Private Key Derivation
    const derivedNode = hdNode.derivePath(path);
    const privateKey = derivedNode.privateKey;
    document.getElementById('outPrivKey').innerText = privateKey;

    // 3. secp256k1 Public Key (Uncompressed: 0x04 + 64 bytes)
    const publicKey = derivedNode.publicKey; // 0x04...
    document.getElementById('outPubKey').innerText = publicKey;

    // 4. Keccak-256 Hash of Public Key (excluding leading '0x04' prefix)
    const uncompressedBytes = ethers.utils.arrayify(publicKey);
    const rawPubKeyBytes = uncompressedBytes.slice(1); // Remove 0x04 byte
    const keccakHash = ethers.utils.keccak256(rawPubKeyBytes);
    document.getElementById('outHash').innerText = keccakHash;

    // 5. Raw Address (Last 20 bytes = last 40 hex chars)
    const rawAddress = '0x' + keccakHash.slice(-40);
    document.getElementById('outRawAddr').innerText = rawAddress.toLowerCase();

    // 6. EIP-55 Checksummed Address
    const checksummedAddress = ethers.utils.getAddress(rawAddress);
    document.getElementById('outFinalAddr').innerText = checksummedAddress;

  } catch (error) {
    alert("Invalid Mnemonic or Derivation Path format.");
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const genBtn = document.getElementById('generateBtn');
  const deriveBtn = document.getElementById('deriveBtn');

  if (genBtn) {
    genBtn.addEventListener('click', generateAndDeriveWallet);
  }

  if (deriveBtn) {
    deriveBtn.addEventListener('click', () => {
      const m = document.getElementById('mnemonicInput').value;
      if (m) deriveFromMnemonic(m);
      else generateAndDeriveWallet();
    });
  }

  // Initial calculation on load
  generateAndDeriveWallet();
});