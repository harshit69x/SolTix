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

Run program tests:
```bash
npm run anchor:test
```

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
