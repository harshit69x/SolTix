# SolTix - Solana NFT Ticketing Platform 🎫

A decentralized ticketing platform built on Solana, enabling event organizers to issue verifiable NFT tickets with built-in resale controls and automatic royalty enforcement.

## 🌟 Features

- **NFT Tickets**: Each ticket is a unique Solana NFT with verifiable ownership
- **Resale Controls**: Maximum resale price enforcement at the protocol level
- **Automatic Royalties**: Organizers earn royalties on secondary sales (up to 25%)
- **Fast & Cheap**: ~400ms confirmations, < $0.01 transaction fees
- **Mobile-First**: React Native app with Solana Mobile Wallet Adapter integration
- **Transparent**: All transactions and ownership history on-chain

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native (Expo) + TypeScript + NativeWind
- **Blockchain**: Solana (Anchor Framework)
- **Database**: Supabase (hybrid for fast queries)
- **NFT Standard**: Metaplex Token Metadata
- **State**: Zustand

### Project Structure
```
├── app/                    # React Native screens
├── programs/               # Solana program (Rust)
│   └── soltix-program/     
│       └── src/
│           └── lib.rs      # Main program logic
├── services/               # Frontend services
│   ├── program.ts          # Solana program interaction
│   ├── solana.ts           # Solana connection
│   ├── ticket-service.ts   # Ticket management
│   └── marketplace-service.ts
├── tests/                  # Program tests
└── supabase/               # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.30+

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/soltix.git
cd soltix
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Solana tools** (first time only)
```bash
# Install Rust
winget install Rustlang.Rustup

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.8/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

4. **Setup wallet**
```bash
solana-keygen new
solana config set --url devnet
solana airdrop 2
```

5. **Build & Deploy Solana Program**
```bash
npm run anchor:build
npm run anchor:deploy
npm run program:copy-idl
```

6. **Start mobile app**
```bash
npm start
```

📚 **See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions**

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Fast setup guide (5 minutes)
- **[SOLANA_SETUP.md](SOLANA_SETUP.md)** - Complete deployment guide
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Integration roadmap
- **[SOLIDITY_VS_SOLANA.md](SOLIDITY_VS_SOLANA.md)** - EVM comparison
- **[prd.md](prd.md)** - Product requirements
- **[TECH_Stack.md](TECH_Stack.md)** - Technical architecture

## 🎯 Smart Contract Features

### Instructions
1. **create_event** - Create event with ticketing parameters
2. **mint_ticket** - Purchase and mint NFT ticket
3. **list_ticket** - List ticket for resale
4. **cancel_listing** - Cancel resale listing
5. **buy_ticket** - Purchase listed ticket (with royalties)
6. **deactivate_event** - Deactivate event (organizer only)

### On-Chain Enforcement
- ✅ Maximum resale price caps
- ✅ Automatic royalty distribution (up to 25%)
- ✅ Ownership verification
- ✅ Transfer tracking
- ✅ Immutable event parameters

## 🧪 Testing
<p align="center">
  <img src="https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

<h1 align="center">SolTix</h1>

<p align="center">
  <strong>Decentralized event ticketing & resale on Solana</strong>
</p>

<p align="center">
  Programmable NFT tickets · Enforced royalties · Anti-scalping · Near-zero fees
</p>

---

## What is SolTix?

SolTix is a mobile-first decentralized ticketing protocol built on the **Solana blockchain**. Event organizers issue verifiable, programmable tickets as NFTs — with royalties, resale caps, and transfer rules enforced at the protocol level.

No more counterfeit tickets. No more unchecked scalping. No more opaque secondary markets.

### Why Solana?

| Metric | Solana | Ethereum L1 |
|---|---|---|
| Confirmation time | ~400ms block / <2s finality | ~12s block / minutes for finality |
| Transaction cost | ~$0.00025 | $1–50+ (variable) |
| Throughput | 65,000 TPS theoretical | ~15 TPS |

---

## Features

- **NFT Ticket Minting** — Each ticket is a unique, verifiable Solana NFT (Metaplex standard)
- **Resale Marketplace** — Built-in secondary market with atomic buy/sell execution
- **Royalty Enforcement** — Organizers earn royalties on every resale within the marketplace
- **Resale Price Caps** — On-chain constraints prevent abusive scalping
- **Wallet-Native Auth** — No accounts or passwords; connect Phantom or Solflare
- **Event Discovery** — Browse, search, and filter upcoming events
- **Ticket Management** — View, transfer, and list owned tickets
- **Real-Time State** — Zustand-powered stores synced with on-chain and Supabase data

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Mobile Client                      │
│        Expo · React Native · NativeWind              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Screens │  │  Stores  │  │    Services        │  │
│  │ (Router) │◄►│(Zustand) │◄►│ (RPC + Supabase)  │  │
│  └──────────┘  └──────────┘  └─────────┬─────────┘  │
└────────────────────────────────────────┬┘            │
                                         │             │
                    ┌────────────────────┼─────────────┘
                    │                    │
          ┌────────▼────────┐  ┌────────▼────────┐
          │  Solana Network │  │    Supabase      │
          │  (Devnet/Main)  │  │  (Postgres +     │
          │                 │  │   Storage)        │
          │  Anchor Program │  │  Events, Tickets, │
          │  NFT Minting    │  │  Profiles, etc.   │
          └─────────────────┘  └──────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **Expo SDK 54** (React Native) | Cross-platform mobile app |
| Language | **TypeScript 5.x** (strict) | Type-safe client code |
| Navigation | **Expo Router** | File-based routing |
| Styling | **NativeWind** (Tailwind CSS) | Utility-first styling |
| State | **Zustand** | Lightweight reactive stores |
| Forms | **React Hook Form + Zod** | Validation & form state |
| Blockchain | **@solana/web3.js** | Transaction construction & RPC |
| Wallet | **Solana Mobile Wallet Adapter** | Phantom / Solflare integration |
| Backend | **Supabase** (PostgreSQL) | Events, tickets, profiles, storage |
| Smart Contracts | **Rust + Anchor** | On-chain program logic |
| NFT Standard | **Metaplex Token Metadata** | NFT minting & metadata |
| Storage | **Arweave / IPFS** | Decentralized metadata storage |

---

## Project Structure

```
SolTix/
├── app/                    # Screens (file-based routing)
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Entry point
│   ├── landing.tsx         # Landing / onboarding
│   ├── modal.tsx           # Global modal
│   ├── (tabs)/             # Tab navigator
│   │   ├── index.tsx       #   Dashboard
│   │   ├── explore.tsx     #   Event discovery
│   │   ├── marketplace.tsx #   Resale marketplace
│   │   ├── tickets.tsx     #   My tickets
│   │   └── settings.tsx    #   Settings
│   ├── event/[id].tsx      # Event details (dynamic)
│   └── resale/[id].tsx     # Resale listing (dynamic)
├── components/             # Reusable UI components
│   ├── ui/                 #   Primitives (button, search, loading)
│   ├── event-card.tsx      #   Event card
│   ├── ticket-card.tsx     #   Ticket card
│   ├── listing-card.tsx    #   Marketplace listing
│   ├── wallet-modal.tsx    #   Wallet connection modal
│   └── transaction-modal.tsx # Transaction confirmation
├── services/               # API & blockchain service layer
│   ├── solana.ts           #   Solana RPC client
│   ├── supabase.ts         #   Supabase client
│   ├── event-service.ts    #   Event CRUD
│   ├── ticket-service.ts   #   Ticket operations
│   ├── marketplace-service.ts # Listing operations
│   └── wallet-service.ts   #   Wallet connection
├── store/                  # Zustand state stores
│   ├── wallet-store.ts     #   Wallet & auth state
│   ├── event-store.ts      #   Events state
│   ├── ticket-store.ts     #   Tickets state
│   └── marketplace-store.ts #  Marketplace state
├── types/                  # TypeScript type definitions
│   ├── index.ts            #   App-wide types
│   └── database.ts         #   Supabase DB types
├── constants/              # Theme & config constants
├── hooks/                  # Custom React hooks
├── supabase/               # Database schema & seed data
│   ├── schema.sql          #   PostgreSQL schema
│   └── seed.sql            #   Sample event data
└── data/                   # Mock data for development
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Expo CLI** — `npm install -g expo-cli`
- A Solana wallet app on your phone ([Phantom](https://phantom.app) or [Solflare](https://solflare.com))
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & Install

Run program tests:
```bash
npm run anchor:test
git clone https://github.com/your-org/soltix.git
cd soltix
npm install
```

### 2. Configure Environment

Copy the example env and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Solana
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_PROGRAM_ID=YourProgramPublicKey

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Storage
EXPO_PUBLIC_ARWEAVE_GATEWAY=https://arweave.net
EXPO_PUBLIC_IPFS_GATEWAY=https://ipfs.io
```

### 3. Set Up Supabase

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql)
3. Then run [`supabase/seed.sql`](supabase/seed.sql) for sample data
4. Copy your **Project URL** and **anon key** from `Settings → API` into `.env`
5. *(Optional)* Create a public `event-images` storage bucket for event artwork

### 4. Run the App

```bash
# Start the Expo dev server
npx expo start --clear

# Or target a specific platform
npx expo start --android
npx expo start --ios
```

Scan the QR code with **Expo Go** or run on an emulator/simulator.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Reset to blank project |
| `npm run eas:build:apk` | Build Android APK via EAS |
| `npm run eas:build:preview` | Build Android preview via EAS |
| `npm run eas:build:production` | Production build via EAS |

---

## Core User Flows

### Wallet Connection
```
Landing Page → Connect Wallet → Approve in Phantom/Solflare → Dashboard
```

### Ticket Purchase
```
Browse Events → Event Details → Buy Ticket → Confirm Tx → NFT Minted → My Tickets
```

### Ticket Resale
```
My Tickets → Select Ticket → List for Resale → Set Price (within cap) → On-chain Listing → Marketplace
```

### Resale Purchase
```
Marketplace → View Listing → Buy → Atomic Transfer (SOL + NFT) → Royalties Distributed
```

---

## Database Schema

The Supabase PostgreSQL database includes these core tables:

| Table | Purpose |
|---|---|
| `profiles` | User profiles keyed by wallet address |
| `events` | Event metadata (title, date, venue, pricing, constraints) |
| `tickets` | NFT ticket records with ownership & status tracking |
| `marketplace_listings` | Active resale listings with price validation |
| `transactions` | On-chain transaction history & settlement records |

See [`supabase/schema.sql`](supabase/schema.sql) for the full schema with enums, indexes, and RLS policies.

---

## Wallet & Network Configuration

### Devnet (Development)
```env
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_NETWORK=devnet
```
Get free devnet SOL at [faucet.solana.com](https://faucet.solana.com).

### Mainnet (Production)
```env
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_NETWORK=mainnet-beta
```

For production throughput, use a dedicated RPC provider:
- [Helius](https://helius.dev) — Recommended for Solana
- [QuickNode](https://quicknode.com)
- [Alchemy](https://alchemy.com)

---

## Building for Production

SolTix uses [EAS Build](https://docs.expo.dev/eas/) for native builds:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project
eas build:configure

# Build Android APK (for testing)
npm run eas:build:apk

# Build production release
npm run eas:build:production
```

---

## Security Model

| Aspect | Approach |
|---|---|
| Authentication | Wallet-based (no passwords, no PII) |
| Transaction signing | Delegated to external wallet (Phantom/Solflare) |
| Key storage | App **never** holds private keys |
| Session persistence | Wallet address stored in Expo SecureStore (encrypted) |
| Royalty enforcement | On-chain within SolTix marketplace |
| Resale constraints | Validated by Solana program before execution |

---

## Roadmap

- [x] **MVP** — Event creation, NFT minting, resale marketplace, royalty enforcement
- [ ] Creator dashboards & analytics
- [ ] Fiat on-ramp integration
- [ ] VIP ticket tiers with perks
- [ ] Event cancellation & refund logic
- [ ] DAO-governed event policies
- [ ] Cross-chain bridging
- [ ] Dynamic ticket metadata

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please ensure:
- TypeScript strict mode passes
- ESLint checks pass (`npm run lint`)
- New features include appropriate types in `types/`

---

Watch program logs:
```bash
solana logs YOUR_PROGRAM_ID --url devnet
```

## 💻 Development

### Available Scripts

```bash
# Mobile App
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS

# Solana Program
npm run anchor:build   # Build program
npm run anchor:deploy  # Deploy to devnet
npm run anchor:test    # Run tests
npm run anchor:keys    # Show program ID

# Utilities
npm run solana:airdrop # Get devnet SOL
npm run solana:balance # Check balance
```

## 🌐 Deployment

### Devnet (Testing)
```bash
solana config set --url devnet
npm run anchor:build
npm run anchor:deploy
```

### Mainnet (Production)
```bash
solana config set --url mainnet-beta
npm run anchor:build
npm run anchor:deploy:mainnet
```

⚠️ **Test thoroughly on devnet before mainnet deployment!**

## 📱 Mobile App Features

- **Wallet Integration**: Phantom, Solflare support
- **Event Discovery**: Browse and search events
- **Ticket Purchase**: Buy tickets as NFTs
- **My Tickets**: View owned tickets
- **Marketplace**: List and buy resale tickets
- **Settings**: Manage wallet and preferences

## 🔒 Security Features

- PDAs (Program Derived Addresses) for deterministic accounts
- Ownership verification on all operations
- Price cap enforcement at protocol level
- Royalty enforcement in marketplace
- Transfer count tracking
- Event deactivation protection

## 💰 Cost Comparison

| Operation | Ethereum | Solana |
|-----------|----------|--------|
| Deploy | $500-1000 | $50-200 |
| Create Event | $20-50 | $0.001 |
| Mint Ticket | $30-80 | $0.002 |
| Buy Ticket | $40-100 | $0.001 |

**Solana is ~25-50x cheaper!**

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- [Solana Discord](https://discord.gg/solana)
- [Anchor Discord](https://discord.gg/anchorlang)
- [Solana Stack Exchange](https://solana.stackexchange.com/)

## 🎉 Acknowledgments

- Solana Foundation
- Metaplex Foundation
- Anchor Framework
- Expo Team

---

Built with ❤️ on Solana
## Documentation

| Document | Description |
|---|---|
| [`SETUP.md`](SETUP.md) | Detailed production setup guide |
| [`TECH_Stack.md`](TECH_Stack.md) | Full technology stack documentation |
| [`APP_Flow.md`](APP_Flow.md) | User flows & interaction design |
| [`prd.md`](prd.md) | Product requirements document |

---

## License

This project is private and not licensed for public distribution.

---

<p align="center">
  Built with Solana · Powered by Expo · Secured by cryptography
</p>
