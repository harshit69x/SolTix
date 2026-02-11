# Solana Program Setup & Deployment Guide

## 🚀 Complete Setup Instructions

This guide will walk you through setting up and deploying your SolTix Solana program from scratch.

---

## Prerequisites

### 1. Install Rust
```bash
# Windows (PowerShell as Administrator)
winget install Rustlang.Rustup

# Or download from: https://rustup.rs/
```

After installation, verify:
```bash
rustc --version
cargo --version
```

### 2. Install Solana CLI
```bash
# Windows (PowerShell as Administrator)
# Download installer
cmd /c "curl https://release.solana.com/v1.18.8/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs"

# Run installer
C:\solana-install-tmp\solana-install-init.exe v1.18.8
```

Add to PATH (add these to your PowerShell profile):
```bash
$env:PATH += ";C:\Users\YOUR_USERNAME\.local\share\solana\install\active_release\bin"
```

Verify installation:
```bash
solana --version
solana-keygen --version
```

### 3. Install Anchor Framework
```bash
# Install Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Anchor CLI
avm install latest
avm use latest
```

Verify:
```bash
anchor --version
```

### 4. Install Node.js Dependencies (Already Done)
```bash
npm install
```

---

## 🔑 Wallet Setup

### 1. Create a New Solana Wallet
```bash
# Create new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Or use existing wallet from Phantom/Solflare
# Export private key and save to file
```

**⚠️ IMPORTANT: Save your seed phrase securely!**

### 2. Configure Solana CLI
```bash
# Set to devnet
solana config set --url devnet

# Verify configuration
solana config get
```

### 3. Get Devnet SOL
```bash
# Airdrop SOL for deployment (you need ~2-4 SOL)
solana airdrop 2

# Check balance
solana balance
```

If airdrop fails, use: https://faucet.solana.com/

---

## 🏗️ Build the Program

### 1. Navigate to Your Project
```bash
cd D:\SolTix
```

### 2. Build the Program
```bash
# Build the Anchor program
anchor build
```

This will:
- Compile your Rust program
- Generate IDL (Interface Definition Language) file
- Create the program binary

Build artifacts location:
- Program: `target/deploy/soltix_program.so`
- IDL: `target/idl/soltix_program.json`
- TypeScript types: `target/types/soltix_program.ts`

### 3. Get Your Program ID
```bash
# Show the program ID
anchor keys list
```

Copy the program ID and update it in:
- `Anchor.toml` (programs.localnet and programs.devnet)
- `programs/soltix-program/src/lib.rs` (declare_id! macro)

Then rebuild:
```bash
anchor build
```

---

## 🚀 Deploy to Devnet

### 1. Deploy the Program
```bash
anchor deploy --provider.cluster devnet
```

Expected output:
```
Deploying workspace: https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
Upgrade authority: YOUR_WALLET_ADDRESS
Deploying program "soltix_program"...
Program Id: YOUR_PROGRAM_ID

Deploy success
```

### 2. Verify Deployment
```bash
# Check program exists
solana program show YOUR_PROGRAM_ID --url devnet

# View on Solana Explorer
# https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

---

## 🧪 Testing the Program

### 1. Create Test File
Create `tests/soltix-program.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoltixProgram } from "../target/types/soltix_program";
import { expect } from "chai";

describe("soltix-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoltixProgram as Program<SoltixProgram>;

  it("Creates an event", async () => {
    const eventName = "Test Concert";
    const [eventPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("event"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(eventName),
      ],
      program.programId
    );

    const tx = await program.methods
      .createEvent(
        eventName,
        new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL), // 1 SOL
        new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL), // 2 SOL max resale
        10, // 10% royalty
        "https://example.com/event-metadata.json"
      )
      .accounts({
        event: eventPDA,
        organizer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Event created:", tx);

    const eventAccount = await program.account.event.fetch(eventPDA);
    expect(eventAccount.name).to.equal(eventName);
    expect(eventAccount.active).to.be.true;
  });
});
```

### 2. Run Tests
```bash
anchor test --skip-local-validator
```

---

## 📱 Integrate with Frontend

### 1. Copy IDL to Frontend
```bash
# Copy the generated IDL
cp target/idl/soltix_program.json app/idl/
```

### 2. Update Program Service
Update `services/program.ts` to import the IDL:

```typescript
import idl from '../app/idl/soltix_program.json';

export function initializeProgram(wallet: any) {
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );

  const program = new Program(
    idl as any,
    PROGRAM_ID,
    provider
  );

  return { provider, program };
}
```

### 3. Use in Your App
Example in a React component:

```typescript
import { initializeProgram, createEvent } from '@/services/program';
import { useWallet } from '@/hooks/useWallet';

function CreateEventComponent() {
  const wallet = useWallet();

  const handleCreateEvent = async () => {
    const { provider, program } = initializeProgram(wallet);
    
    const result = await createEvent(provider, program, {
      name: "My Concert",
      originalPrice: 1.5, // SOL
      maxResalePrice: 3.0, // SOL
      royaltyPercentage: 10,
      eventUri: "https://arweave.net/your-metadata"
    });

    console.log("Event created:", result.eventPDA.toString());
  };

  return <button onClick={handleCreateEvent}>Create Event</button>;
}
```

---

## 🔍 Debugging

### View Program Logs
```bash
solana logs YOUR_PROGRAM_ID --url devnet
```

### Check Account Data
```bash
# View event account
solana account EVENT_PDA --url devnet

# View ticket account
solana account TICKET_PDA --url devnet
```

### Common Issues

**1. "Insufficient funds"**
```bash
solana airdrop 2  # Get more devnet SOL
```

**2. "Program not deployed"**
```bash
anchor deploy --provider.cluster devnet
```

**3. "Invalid program ID"**
- Update program ID in `Anchor.toml` and `lib.rs`
- Rebuild with `anchor build`

---

## 🌐 Deploy to Mainnet

⚠️ **ONLY do this when thoroughly tested!**

### 1. Get Mainnet SOL
Buy SOL on an exchange and send to your wallet

### 2. Configure for Mainnet
```bash
solana config set --url mainnet-beta
```

### 3. Deploy
```bash
anchor deploy --provider.cluster mainnet-beta
```

Deployment costs ~2-4 SOL depending on program size.

### 4. Verify
```bash
solana program show YOUR_PROGRAM_ID --url mainnet-beta
```

---

## 📊 Program Features

### Instructions Available:
1. **create_event** - Create a new event with ticketing parameters
2. **mint_ticket** - Purchase and mint an NFT ticket
3. **list_ticket** - List ticket for resale
4. **cancel_listing** - Cancel a resale listing
5. **buy_ticket** - Buy a listed ticket (with royalty enforcement)
6. **deactivate_event** - Deactivate an event (organizer only)

### On-Chain Enforcement:
- ✅ Maximum resale price caps
- ✅ Automatic royalty distribution to organizers
- ✅ Ownership verification
- ✅ Transfer tracking
- ✅ Immutable event parameters

---

## 🎯 Next Steps

1. ✅ Program is deployed
2. ⬜ Test all instructions on devnet
3. ⬜ Integrate with your mobile app
4. ⬜ Add metadata upload to Arweave/IPFS
5. ⬜ Build UI for event creation
6. ⬜ Add ticket viewing functionality
7. ⬜ Implement marketplace UI
8. ⬜ Security audit before mainnet

---

## 📚 Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Program Examples](https://github.com/solana-developers/program-examples)
- [Metaplex Documentation](https://docs.metaplex.com/)

---

## 🆘 Need Help?

- Solana Discord: https://discord.gg/solana
- Anchor Discord: https://discord.gg/anchorlang
- Solana StackExchange: https://solana.stackexchange.com/

---

## 💡 Quick Reference Commands

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Test
anchor test --skip-local-validator

# Get devnet SOL
solana airdrop 2

# Check balance
solana balance

# View logs
solana logs YOUR_PROGRAM_ID --url devnet

# Get program info
solana program show YOUR_PROGRAM_ID --url devnet
```
