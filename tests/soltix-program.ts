import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

describe("SolTix Program Tests", () => {
  // Configure the client
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoltixProgram as Program;
  
  let eventPDA: PublicKey;
  let ticketPDA: PublicKey;
  let mintKeypair: Keypair;
  const eventName = `Test Event ${Date.now()}`;

  it("Creates an event successfully", async () => {
    const organizer = provider.wallet.publicKey;
    
    // Derive event PDA
    [eventPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("event"),
        organizer.toBuffer(),
        Buffer.from(eventName),
      ],
      program.programId
    );

    const originalPrice = new BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL
    const maxResalePrice = new BN(0.2 * LAMPORTS_PER_SOL); // 0.2 SOL
    const royaltyPercentage = 10; // 10%

    const tx = await program.methods
      .createEvent(
        eventName,
        originalPrice,
        maxResalePrice,
        royaltyPercentage,
        "https://arweave.net/test-event-metadata"
      )
      .accounts({
        event: eventPDA,
        organizer: organizer,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Event created. Transaction:", tx);
    console.log("   Event PDA:", eventPDA.toString());

    // Fetch and verify event data
    const eventAccount = await program.account.event.fetch(eventPDA);
    
    expect(eventAccount.name).to.equal(eventName);
    expect(eventAccount.organizer.toString()).to.equal(organizer.toString());
    expect(eventAccount.originalPrice.toNumber()).to.equal(originalPrice.toNumber());
    expect(eventAccount.maxResalePrice.toNumber()).to.equal(maxResalePrice.toNumber());
    expect(eventAccount.royaltyPercentage).to.equal(royaltyPercentage);
    expect(eventAccount.active).to.be.true;
    expect(eventAccount.totalMinted).to.equal(0);

    console.log("   Event details:", {
      name: eventAccount.name,
      price: `${eventAccount.originalPrice.toNumber() / LAMPORTS_PER_SOL} SOL`,
      maxResale: `${eventAccount.maxResalePrice.toNumber() / LAMPORTS_PER_SOL} SOL`,
      royalty: `${eventAccount.royaltyPercentage}%`,
    });
  });

  it("Mints a ticket NFT", async () => {
    // Generate new mint keypair
    mintKeypair = Keypair.generate();

    // Derive ticket PDA
    [ticketPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), mintKeypair.publicKey.toBuffer()],
      program.programId
    );

    const buyer = provider.wallet.publicKey;
    const eventAccount = await program.account.event.fetch(eventPDA);

    // Note: In real usage, you'd calculate ATA properly
    // This is simplified for testing

    const tx = await program.methods
      .mintTicket()
      .accounts({
        event: eventPDA,
        ticket: ticketPDA,
        mint: mintKeypair.publicKey,
        buyer: buyer,
        organizerAccount: eventAccount.organizer,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([mintKeypair])
      .rpc();

    console.log("✅ Ticket minted. Transaction:", tx);
    console.log("   Ticket PDA:", ticketPDA.toString());
    console.log("   Mint:", mintKeypair.publicKey.toString());

    // Fetch and verify ticket data
    const ticketAccount = await program.account.ticket.fetch(ticketPDA);
    
    expect(ticketAccount.event.toString()).to.equal(eventPDA.toString());
    expect(ticketAccount.mint.toString()).to.equal(mintKeypair.publicKey.toString());
    expect(ticketAccount.currentOwner.toString()).to.equal(buyer.toString());
    expect(ticketAccount.forSale).to.be.false;
    expect(ticketAccount.transferCount).to.equal(0);

    console.log("   Ticket details:", {
      owner: ticketAccount.currentOwner.toString().slice(0, 8) + "...",
      forSale: ticketAccount.forSale,
      transfers: ticketAccount.transferCount,
    });

    // Verify event total minted increased
    const updatedEvent = await program.account.event.fetch(eventPDA);
    expect(updatedEvent.totalMinted).to.equal(1);
  });

  it("Lists ticket for resale", async () => {
    const listPrice = new BN(0.15 * LAMPORTS_PER_SOL); // 0.15 SOL

    const tx = await program.methods
      .listTicket(listPrice)
      .accounts({
        ticket: ticketPDA,
        event: eventPDA,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Ticket listed. Transaction:", tx);

    // Verify listing
    const ticketAccount = await program.account.ticket.fetch(ticketPDA);
    
    expect(ticketAccount.forSale).to.be.true;
    expect(ticketAccount.listingPrice.toNumber()).to.equal(listPrice.toNumber());

    console.log("   Listed for:", `${listPrice.toNumber() / LAMPORTS_PER_SOL} SOL`);
  });

  it("Fails to list above max resale price", async () => {
    // Cancel current listing first
    await program.methods
      .cancelListing()
      .accounts({
        ticket: ticketPDA,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Try to list above max
    const tooHighPrice = new BN(0.3 * LAMPORTS_PER_SOL); // Above 0.2 SOL max

    try {
      await program.methods
        .listTicket(tooHighPrice)
        .accounts({
          ticket: ticketPDA,
          event: eventPDA,
          owner: provider.wallet.publicKey,
        })
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      console.log("✅ Correctly rejected listing above max resale price");
      expect(error.toString()).to.include("PriceExceedsMax");
    }
  });

  it("Cancels listing", async () => {
    // List again first
    await program.methods
      .listTicket(new BN(0.15 * LAMPORTS_PER_SOL))
      .accounts({
        ticket: ticketPDA,
        event: eventPDA,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Cancel
    const tx = await program.methods
      .cancelListing()
      .accounts({
        ticket: ticketPDA,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Listing cancelled. Transaction:", tx);

    // Verify
    const ticketAccount = await program.account.ticket.fetch(ticketPDA);
    expect(ticketAccount.forSale).to.be.false;
    expect(ticketAccount.listingPrice.toNumber()).to.equal(0);
  });

  it("Deactivates event (organizer only)", async () => {
    const tx = await program.methods
      .deactivateEvent()
      .accounts({
        event: eventPDA,
        organizer: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Event deactivated. Transaction:", tx);

    // Verify
    const eventAccount = await program.account.event.fetch(eventPDA);
    expect(eventAccount.active).to.be.false;
  });

  it("Fails to mint ticket for inactive event", async () => {
    const newMint = Keypair.generate();
    const [newTicketPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), newMint.publicKey.toBuffer()],
      program.programId
    );

    const eventAccount = await program.account.event.fetch(eventPDA);

    try {
      await program.methods
        .mintTicket()
        .accounts({
          event: eventPDA,
          ticket: newTicketPDA,
          mint: newMint.publicKey,
          buyer: provider.wallet.publicKey,
          organizerAccount: eventAccount.organizer,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMint])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      console.log("✅ Correctly rejected minting for inactive event");
      expect(error.toString()).to.include("EventNotActive");
    }
  });

  after(() => {
    console.log("\n📊 Test Summary:");
    console.log("   Event PDA:", eventPDA.toString());
    console.log("   Ticket PDA:", ticketPDA.toString());
    console.log("   View on Explorer:");
    console.log(`   https://explorer.solana.com/address/${eventPDA.toString()}?cluster=devnet`);
  });
});
