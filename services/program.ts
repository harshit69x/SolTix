import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { connection } from './solana';
import idl from '../app/idl/soltix_program.json';

// Program ID from Anchor.toml
export const PROGRAM_ID = new PublicKey('QoWSByU5eAUTSrZebW1q8xRMuAkuvgsiqwEZ16EVRHJ');

// IDL Type (you'll generate this with anchor build)
export interface SoltixProgram {
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
  events: any[];
  errors: any[];
}

// ─── Helper: Get Event PDA ───
export function getEventPDA(organizer: PublicKey, eventName: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('event'), organizer.toBuffer(), Buffer.from(eventName)],
    PROGRAM_ID
  );
}

// ─── Helper: Get Ticket PDA ───
export function getTicketPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('ticket'), mint.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Create Event ───
export async function createEvent(
  provider: AnchorProvider,
  program: Program,
  params: {
    name: string;
    originalPrice: number; // in SOL
    maxResalePrice: number; // in SOL
    royaltyPercentage: number;
    eventUri: string;
  }
): Promise<{ signature: string; eventPDA: PublicKey }> {
  const organizer = provider.wallet.publicKey;
  const [eventPDA] = getEventPDA(organizer, params.name);

  const originalPriceLamports = new BN(params.originalPrice * anchor.web3.LAMPORTS_PER_SOL);
  const maxResalePriceLamports = new BN(params.maxResalePrice * anchor.web3.LAMPORTS_PER_SOL);

  const tx = await program.methods
    .createEvent(
      params.name,
      originalPriceLamports,
      maxResalePriceLamports,
      params.royaltyPercentage,
      params.eventUri
    )
    .accounts({
      event: eventPDA,
      organizer: organizer,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { signature: tx, eventPDA };
}

// ─── Mint Ticket ───
export async function mintTicket(
  provider: AnchorProvider,
  program: Program,
  eventPDA: PublicKey,
  mintKeypair: anchor.web3.Keypair
): Promise<{ signature: string; ticketPDA: PublicKey; mint: PublicKey }> {
  const buyer = provider.wallet.publicKey;
  const [ticketPDA] = getTicketPDA(mintKeypair.publicKey);

  // Get event data to find organizer
  const eventAccount = await program.account.event.fetch(eventPDA);
  const tokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    buyer
  );

  const tx = await program.methods
    .mintTicket()
    .accounts({
      event: eventPDA,
      ticket: ticketPDA,
      mint: mintKeypair.publicKey,
      tokenAccount: tokenAccount,
      buyer: buyer,
      organizerAccount: eventAccount.organizer,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([mintKeypair])
    .rpc();

  return { signature: tx, ticketPDA, mint: mintKeypair.publicKey };
}

// ─── List Ticket ───
export async function listTicket(
  provider: AnchorProvider,
  program: Program,
  ticketPDA: PublicKey,
  price: number // in SOL
): Promise<string> {
  const owner = provider.wallet.publicKey;

  // Get ticket data to find event
  const ticketAccount = await program.account.ticket.fetch(ticketPDA);
  const priceLamports = new BN(price * anchor.web3.LAMPORTS_PER_SOL);

  const tx = await program.methods
    .listTicket(priceLamports)
    .accounts({
      ticket: ticketPDA,
      event: ticketAccount.event,
      owner: owner,
    })
    .rpc();

  return tx;
}

// ─── Cancel Listing ───
export async function cancelListing(
  provider: AnchorProvider,
  program: Program,
  ticketPDA: PublicKey
): Promise<string> {
  const owner = provider.wallet.publicKey;

  const tx = await program.methods
    .cancelListing()
    .accounts({
      ticket: ticketPDA,
      owner: owner,
    })
    .rpc();

  return tx;
}

// ─── Buy Ticket ───
export async function buyTicket(
  provider: AnchorProvider,
  program: Program,
  ticketPDA: PublicKey
): Promise<string> {
  const buyer = provider.wallet.publicKey;

  // Get ticket data
  const ticketAccount = await program.account.ticket.fetch(ticketPDA);
  const eventAccount = await program.account.event.fetch(ticketAccount.event);

  const sellerTokenAccount = await getAssociatedTokenAddress(
    ticketAccount.mint,
    ticketAccount.currentOwner
  );

  const buyerTokenAccount = await getAssociatedTokenAddress(
    ticketAccount.mint,
    buyer
  );

  const tx = await program.methods
    .buyTicket()
    .accounts({
      ticket: ticketPDA,
      event: ticketAccount.event,
      buyer: buyer,
      seller: ticketAccount.currentOwner,
      organizerAccount: eventAccount.organizer,
      sellerTokenAccount: sellerTokenAccount,
      buyerTokenAccount: buyerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ─── Deactivate Event ───
export async function deactivateEvent(
  provider: AnchorProvider,
  program: Program,
  eventPDA: PublicKey
): Promise<string> {
  const organizer = provider.wallet.publicKey;

  const tx = await program.methods
    .deactivateEvent()
    .accounts({
      event: eventPDA,
      organizer: organizer,
    })
    .rpc();

  return tx;
}

// ─── Fetch Event Data ───
export async function fetchEvent(
  program: Program,
  eventPDA: PublicKey
): Promise<any> {
  return await program.account.event.fetch(eventPDA);
}

// ─── Fetch Ticket Data ───
export async function fetchTicket(
  program: Program,
  ticketPDA: PublicKey
): Promise<any> {
  return await program.account.ticket.fetch(ticketPDA);
}

// ─── Fetch All Events (by organizer) ───
export async function fetchEventsByOrganizer(
  program: Program,
  organizer: PublicKey
): Promise<any[]> {
  return await program.account.event.all([
    {
      memcmp: {
        offset: 8, // After discriminator
        bytes: organizer.toBase58(),
      },
    },
  ]);
}

// ─── Fetch All Tickets (by owner) ───
export async function fetchTicketsByOwner(
  program: Program,
  owner: PublicKey
): Promise<any[]> {
  return await program.account.ticket.all([
    {
      memcmp: {
        offset: 8 + 32 + 32 + 32, // After discriminator + event + mint + original_owner
        bytes: owner.toBase58(),
      },
    },
  ]);
}

// ─── Fetch All Listed Tickets ───
export async function fetchListedTickets(program: Program): Promise<any[]> {
  const allTickets = await program.account.ticket.all();
  return allTickets.filter((ticket) => ticket.account.forSale);
}

// ─── Initialize Program (for frontend use) ───
export function initializeProgram(wallet: any): { provider: AnchorProvider; program: Program } {
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
