/**
 * Import Phantom wallet private key into Solana CLI format
 * 
 * Usage: node scripts/import-wallet.js
 * Then paste your Phantom private key when prompted.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Handle both bs58 v4 and v5/v6
let bs58Decode;
try {
  const bs58 = require('bs58');
  if (typeof bs58.decode === 'function') {
    bs58Decode = bs58.decode;
  } else if (bs58.default && typeof bs58.default.decode === 'function') {
    bs58Decode = bs58.default.decode;
  } else {
    throw new Error('incompatible bs58');
  }
} catch {
  // Fallback to the version bundled with @solana/web3.js
  const bs58v4 = require('@solana/web3.js/node_modules/bs58') || require('bs58');
  bs58Decode = bs58v4.decode || bs58v4.default.decode;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const outputPath = path.join(
  process.env.USERPROFILE || process.env.HOME,
  '.config',
  'solana',
  'id.json'
);

rl.question('Paste your Phantom private key (base58): ', (key) => {
  try {
    const decoded = Array.from(bs58Decode(key.trim()));

    if (decoded.length !== 64) {
      console.error(`❌ Invalid key length (${decoded.length} bytes, expected 64)`);
      process.exit(1);
    }

    fs.writeFileSync(outputPath, JSON.stringify(decoded));
    console.log(`✅ Keypair saved to: ${outputPath}`);
    console.log('Run "solana address" to verify your wallet address.');
  } catch (err) {
    console.error('❌ Failed to decode key:', err.message);
    process.exit(1);
  }
  rl.close();
});
