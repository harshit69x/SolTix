# 🚀 Quick Start Guide - SolTix Solana Program

## Installation (5 minutes)

### Step 1: Install Prerequisites
```powershell
# Install Rust
winget install Rustlang.Rustup

# Install Solana CLI (download and run installer)
cmd /c "curl https://release.solana.com/v1.18.8/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs"
C:\solana-install-tmp\solana-install-init.exe v1.18.8

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Step 2: Setup Wallet
```powershell
# Create wallet
solana-keygen new

# Set to devnet
solana config set --url devnet

# Get free SOL
solana airdrop 2
solana airdrop 2  # Get more if needed

# Check balance
solana balance
```

---

## Build & Deploy (2 minutes)

```powershell
# Navigate to project
cd D:\SolTix

# Build program
anchor build

# Get and update program ID
anchor keys list
# Copy the program ID shown

# Update the ID in these files:
# 1. Anchor.toml (lines 7 & 10)
# 2. programs/soltix-program/src/lib.rs (line 8)

# Rebuild with new ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

✅ **Done! Your program is now live on Solana devnet**

View on explorer:
`https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet`

---

## Test It Works

```powershell
# Create test file first (see SOLANA_SETUP.md)
anchor test --skip-local-validator
```

---

## Integrate with Your App

1. **Copy IDL to frontend:**
```powershell
mkdir app\idl
copy target\idl\soltix_program.json app\idl\
```

2. **Update PROGRAM_ID in frontend:**
Edit `services/program.ts` line 8 with your program ID

3. **Use in React Native:**
```typescript
import { initializeProgram, createEvent } from '@/services/program';

// In your component
const { provider, program } = initializeProgram(wallet);
const result = await createEvent(provider, program, {
  name: "Concert",
  originalPrice: 1.5,
  maxResalePrice: 3.0,
  royaltyPercentage: 10,
  eventUri: "https://..."
});
```

---

## Key Commands

```bash
# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Get more SOL
solana airdrop 2

# View logs (in separate terminal)
solana logs YOUR_PROGRAM_ID --url devnet
```

---

## Troubleshooting

**"Insufficient funds"**
```bash
solana airdrop 2
```

**"anchor: command not found"**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
```

**"Program ID mismatch"**
1. Run `anchor keys list`
2. Update ID in `Anchor.toml` and `lib.rs`
3. Run `anchor build` again

---

## What You Just Built 🎉

Your Solana program now supports:
- ✅ Create events with pricing rules
- ✅ Mint NFT tickets
- ✅ List tickets for resale with price caps
- ✅ Automatic royalty enforcement
- ✅ Ownership tracking
- ✅ Transfer history

All enforced on-chain, immutable, and decentralized!

---

## Next: Connect Your Mobile App

See `SOLANA_SETUP.md` for detailed integration guide.
