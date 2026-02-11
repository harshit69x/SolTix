# Solidity vs Solana Implementation Comparison

This document shows how your Ethereum/Solidity contract was adapted to Solana/Rust.

---

## Architecture Differences

| Aspect | Ethereum/Solidity | Solana/Rust |
|--------|------------------|-------------|
| **Program Model** | Smart Contract (state + functions) | Program + Accounts (separated) |
| **State Storage** | Contract storage (expensive) | Account-based (rent-exempt) |
| **Function Calls** | msg.sender, msg.value | Explicit accounts passed |
| **NFT Standard** | ERC-721 | Metaplex Token Metadata |
| **Cost** | High gas fees (~$10-100/tx) | Low fees (~$0.00001-0.0001/tx) |
| **Speed** | ~15 sec block time | ~400ms blocks |

---

## Code Comparison

### Creating an Event

**Solidity:**
```solidity
function createEvent(
    string memory name,
    uint256 price,
    uint256 maxResalePrice,
    uint256 royaltyPercentage,
    string memory eventURI
) public returns (uint256) {
    _eventIds++;
    events[_eventIds] = Event({
        name: name,
        originalPrice: price,
        maxResalePrice: maxResalePrice,
        royaltyPercentage: royaltyPercentage,
        active: true,
        organizer: msg.sender,
        eventURI: eventURI,
        eventId: _eventIds
    });
    return _eventIds;
}
```

**Solana/Anchor:**
```rust
pub fn create_event(
    ctx: Context<CreateEvent>,
    name: String,
    original_price: u64,
    max_resale_price: u64,
    royalty_percentage: u8,
    event_uri: String,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    
    event.organizer = ctx.accounts.organizer.key();
    event.name = name;
    event.original_price = original_price;
    event.max_resale_price = max_resale_price;
    event.royalty_percentage = royalty_percentage;
    event.active = true;
    event.event_uri = event_uri;
    
    Ok(())
}
```

**Key Differences:**
- Solana uses PDAs (Program Derived Addresses) instead of auto-incrementing IDs
- Accounts are explicitly declared in struct
- No `msg.sender` - organizer is part of accounts
- Prices in lamports (smallest unit) instead of Wei

---

### Minting an NFT Ticket

**Solidity:**
```solidity
function mintTicket(uint256 eventId) public payable returns (uint256) {
    Event storage eventDetails = events[eventId];
    require(msg.value >= eventDetails.originalPrice);
    
    // Transfer payment
    payable(eventDetails.organizer).transfer(eventDetails.originalPrice);
    
    // Mint NFT
    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    _mint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, eventDetails.eventURI);
    
    // Store ticket data
    tickets[newTokenId].tokenId = newTokenId;
    tickets[newTokenId].eventId = eventId;
    tickets[newTokenId].owners.push(TicketOwner({
        owner: msg.sender,
        price: eventDetails.originalPrice,
        forSale: false
    }));
    
    return newTokenId;
}
```

**Solana/Anchor:**
```rust
pub fn mint_ticket(ctx: Context<MintTicket>) -> Result<()> {
    let event = &mut ctx.accounts.event;
    
    // Transfer payment (explicit system instruction)
    let ix = system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &event.organizer,
        event.original_price,
    );
    invoke(&ix, &[/*...*/])?;
    
    // Mint NFT using Token program
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.mint.to_account_info(),
    };
    token::mint_to(CpiContext::new(/*...*/), 1)?;
    
    // Initialize ticket state
    let ticket = &mut ctx.accounts.ticket;
    ticket.event = event.key();
    ticket.mint = ctx.accounts.mint.key();
    ticket.current_owner = ctx.accounts.buyer.key();
    ticket.original_price = event.original_price;
    
    Ok(())
}
```

**Key Differences:**
- Solana separates payment and NFT minting into explicit CPIs (Cross-Program Invocations)
- No automatic token ID increment - mint address is the unique ID
- Token account must be created for NFT
- State stored in separate account, not in program

---

### Listing for Resale

**Solidity:**
```solidity
function listTicket(uint256 tokenId, uint256 price) public {
    Ticket storage ticket = tickets[tokenId];
    
    for (uint256 i = 0; i < ticket.owners.length; i++) {
        if (ticket.owners[i].owner == msg.sender) {
            require(price <= events[ticket.eventId].maxResalePrice);
            ticket.owners[i].forSale = true;
            ticket.owners[i].price = price;
            listedTickets.push(tokenId);
            return;
        }
    }
    revert("You do not own this ticket");
}
```

**Solana/Anchor:**
```rust
pub fn list_ticket(ctx: Context<ListTicket>, price: u64) -> Result<()> {
    let ticket = &mut ctx.accounts.ticket;
    let event = &ctx.accounts.event;
    
    require!(
        ticket.current_owner == ctx.accounts.owner.key(),
        ErrorCode::NotOwner
    );
    require!(
        price <= event.max_resale_price,
        ErrorCode::PriceExceedsMax
    );
    
    ticket.for_sale = true;
    ticket.listing_price = price;
    
    Ok(())
}
```

**Key Differences:**
- Solana tracks single current owner, not ownership history array
- Checks are explicit with custom error codes
- No need to iterate - direct access
- Listing state stored in ticket account

---

### Buying a Listed Ticket

**Solidity:**
```solidity
function buyTicket(uint256 tokenId) public payable {
    Ticket storage ticket = tickets[tokenId];
    
    for (uint256 i = 0; i < ticket.owners.length; i++) {
        if (ticket.owners[i].forSale) {
            address seller = ticket.owners[i].owner;
            uint256 price = ticket.owners[i].price;
            uint256 royalty = (price * royaltyPercentage) / 100;
            uint256 sellerProceeds = price - royalty;
            
            // Transfer funds
            payable(organizer).transfer(royalty);
            payable(seller).transfer(sellerProceeds);
            
            // Update ownership
            ticket.owners[i].owner = msg.sender;
            ticket.owners[i].forSale = false;
            
            return;
        }
    }
}
```

**Solana/Anchor:**
```rust
pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
    let ticket = &mut ctx.accounts.ticket;
    let event = &ctx.accounts.event;
    
    let price = ticket.listing_price;
    let royalty = (price as u128 * event.royalty_percentage as u128 / 100) as u64;
    let seller_proceeds = price - royalty;
    
    // Transfer royalty to organizer
    invoke(&system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &event.organizer,
        royalty,
    ), &[/*...*/])?;
    
    // Transfer proceeds to seller
    invoke(&system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &ticket.current_owner,
        seller_proceeds,
    ), &[/*...*/])?;
    
    // Transfer NFT
    let cpi_accounts = Transfer {
        from: ctx.accounts.seller_token_account.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: ctx.accounts.seller.to_account_info(),
    };
    token::transfer(CpiContext::new(/*...*/), 1)?;
    
    // Update state
    ticket.current_owner = ctx.accounts.buyer.key();
    ticket.for_sale = false;
    ticket.transfer_count += 1;
    
    Ok(())
}
```

**Key Differences:**
- Solana requires explicit account declarations for all parties
- NFT transfer is separate from payment transfers
- Token accounts must be passed explicitly
- More verbose but more explicit and secure

---

## State Management Comparison

### Solidity Storage

```solidity
mapping(uint256 => Event) public events;
mapping(uint256 => Ticket) public tickets;
uint256[] public eventList;
uint256[] public listedTickets;
```

- Global mappings in contract storage
- Gas costs scale with data size
- Easy to query specific items
- Expensive to iterate

### Solana Accounts

```rust
#[account]
pub struct Event {
    pub organizer: Pubkey,
    pub name: String,
    pub original_price: u64,
    // ... other fields
}

#[account]
pub struct Ticket {
    pub event: Pubkey,
    pub mint: Pubkey,
    pub current_owner: Pubkey,
    // ... other fields
}
```

- Each instance is a separate account
- Rent-exempt with one-time deposit
- Must use getProgramAccounts or indexer for discovery
- References use Pubkeys instead of IDs

---

## Cost Comparison (Real Numbers)

### Ethereum Mainnet (Typical)
- Deploy contract: ~$500-1000
- Create event: ~$20-50
- Mint ticket: ~$30-80
- List for resale: ~$15-30
- Buy ticket: ~$40-100

**Total for 1 event + 10 tickets sold: ~$1,500-3,000**

### Solana Devnet/Mainnet
- Deploy program: ~0.5-2 SOL ($50-200 one-time)
- Create event: ~0.00001 SOL ($0.001)
- Mint ticket: ~0.00002 SOL ($0.002)
- List for resale: ~0.000005 SOL ($0.0005)
- Buy ticket: ~0.00001 SOL ($0.001)

**Total for 1 event + 10 tickets sold: ~$60 (including deployment)**

**~25-50x cheaper on Solana!**

---

## Performance Comparison

| Operation | Ethereum | Solana |
|-----------|----------|--------|
| Block Time | ~12-15 seconds | ~400ms |
| Finality | ~15 minutes (2048 blocks) | ~2-3 seconds |
| Throughput | ~15-30 TPS | ~3,000 TPS (65k theoretical) |
| Mint 100 tickets | ~25-50 minutes | ~20-40 seconds |

---

## Trade-offs

### Ethereum Advantages
- ✅ More mature ecosystem
- ✅ Stronger tooling (Hardhat, Foundry)
- ✅ Easier state queries (The Graph)
- ✅ More auditors available

### Solana Advantages
- ✅ 25-50x cheaper transactions
- ✅ 20-50x faster confirmations
- ✅ Better for high-frequency use cases (ticket sales)
- ✅ Lower barrier for users (< $0.01/tx)
- ✅ Better mobile wallet support

---

## Why Solana for Ticketing?

1. **Low costs** - Users won't pay $30-80 in gas for a $50 ticket
2. **Fast confirmations** - No waiting 15 seconds per transaction
3. **High throughput** - Can handle concert sales of 1000s of tickets
4. **Mobile-first** - Saga phone, Mobile Wallet Adapter
5. **NFT standards** - Metaplex is mature and widely used

---

## Migration Notes

If you've deployed on Ethereum and want to migrate:

### Data Migration
1. Export event/ticket data from Ethereum
2. Recreate on Solana (PDAs will be different)
3. Run indexer to keep databases in sync

### User Migration
1. Users connect Solana wallet instead of MetaMask
2. Can airdrop equivalent NFTs on Solana
3. Bridge solutions (Wormhole) can connect chains

### Code Reuse
- Frontend logic mostly reusable
- Web3.js → Anchor/web3.js (similar patterns)
- Contract calls → Program instructions
- Event handlers → Event listeners in Anchor

---

## Conclusion

Your Solidity contract translated well to Solana! The core logic is the same:
- ✅ Events with pricing rules
- ✅ NFT ticket minting
- ✅ Resale with price caps
- ✅ Automatic royalty enforcement
- ✅ Ownership tracking

But Solana adds:
- 🚀 Faster (400ms vs 15s blocks)
- 💰 Cheaper (< $0.01 vs $30-100 per tx)
- 📱 Better mobile support
- 🎯 Perfect for ticketing use case

The implementation is more verbose but more explicit about security and accounts, which makes auditing easier and reduces hidden bugs.
