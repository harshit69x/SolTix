use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::{
    CreateV1CpiBuilder, MintV1CpiBuilder,
};
use mpl_token_metadata::types::{TokenStandard, PrintSupply};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod soltix_program {
    use super::*;

    /// Create a new event with ticketing parameters
    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        original_price: u64,
        max_resale_price: u64,
        royalty_percentage: u8,
        event_uri: String,
    ) -> Result<()> {
        require!(royalty_percentage <= 25, ErrorCode::RoyaltyTooHigh);
        require!(original_price > 0, ErrorCode::InvalidPrice);
        require!(max_resale_price >= original_price, ErrorCode::InvalidMaxResale);
        require!(name.len() <= 100, ErrorCode::NameTooLong);
        require!(event_uri.len() <= 200, ErrorCode::UriTooLong);

        let event = &mut ctx.accounts.event;
        let clock = Clock::get()?;

        event.organizer = ctx.accounts.organizer.key();
        event.name = name;
        event.original_price = original_price;
        event.max_resale_price = max_resale_price;
        event.royalty_percentage = royalty_percentage;
        event.active = true;
        event.event_uri = event_uri;
        event.total_minted = 0;
        event.created_at = clock.unix_timestamp;
        event.bump = ctx.bumps.event;

        emit!(EventCreated {
            event_id: event.key(),
            name: event.name.clone(),
            price: original_price,
            organizer: ctx.accounts.organizer.key(),
        });

        Ok(())
    }

    /// Mint a ticket NFT for an event
    pub fn mint_ticket(ctx: Context<MintTicket>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        require!(event.active, ErrorCode::EventNotActive);

        // Transfer payment to organizer
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &event.organizer,
            event.original_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.organizer_account.to_account_info(),
            ],
        )?;

        // Initialize ticket state
        let ticket = &mut ctx.accounts.ticket;
        ticket.event = event.key();
        ticket.mint = ctx.accounts.mint.key();
        ticket.original_owner = ctx.accounts.buyer.key();
        ticket.current_owner = ctx.accounts.buyer.key();
        ticket.original_price = event.original_price;
        ticket.for_sale = false;
        ticket.listing_price = 0;
        ticket.transfer_count = 0;
        ticket.bump = ctx.bumps.ticket;

        // Mint NFT using Token program
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.mint.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, 1)?;

        event.total_minted += 1;

        emit!(TicketMinted {
            ticket_id: ticket.key(),
            event_id: event.key(),
            owner: ctx.accounts.buyer.key(),
            mint: ctx.accounts.mint.key(),
        });

        Ok(())
    }

    /// List a ticket for resale
    pub fn list_ticket(ctx: Context<ListTicket>, price: u64) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        let event = &ctx.accounts.event;

        require!(ticket.current_owner == ctx.accounts.owner.key(), ErrorCode::NotOwner);
        require!(!ticket.for_sale, ErrorCode::AlreadyListed);
        require!(price <= event.max_resale_price, ErrorCode::PriceExceedsMax);
        require!(price > 0, ErrorCode::InvalidPrice);

        ticket.for_sale = true;
        ticket.listing_price = price;

        emit!(TicketListed {
            ticket_id: ticket.key(),
            owner: ctx.accounts.owner.key(),
            price,
        });

        Ok(())
    }

    /// Cancel a ticket listing
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;

        require!(ticket.current_owner == ctx.accounts.owner.key(), ErrorCode::NotOwner);
        require!(ticket.for_sale, ErrorCode::NotListed);

        ticket.for_sale = false;
        ticket.listing_price = 0;

        emit!(ListingCancelled {
            ticket_id: ticket.key(),
            owner: ctx.accounts.owner.key(),
        });

        Ok(())
    }

    /// Buy a listed ticket
    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        let event = &ctx.accounts.event;

        require!(ticket.for_sale, ErrorCode::NotForSale);
        require!(ticket.current_owner != ctx.accounts.buyer.key(), ErrorCode::CannotBuyOwnTicket);

        let price = ticket.listing_price;
        
        // Calculate royalty and seller proceeds
        let royalty = (price as u128)
            .checked_mul(event.royalty_percentage as u128)
            .unwrap()
            .checked_div(100)
            .unwrap() as u64;
        let seller_proceeds = price.checked_sub(royalty).unwrap();

        // Transfer royalty to organizer
        if royalty > 0 {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.buyer.key(),
                &event.organizer,
                royalty,
            );
            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.buyer.to_account_info(),
                    ctx.accounts.organizer_account.to_account_info(),
                ],
            )?;
        }

        // Transfer proceeds to seller
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ticket.current_owner,
            seller_proceeds,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
            ],
        )?;

        // Transfer NFT to buyer
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, 1)?;

        let previous_owner = ticket.current_owner;
        ticket.current_owner = ctx.accounts.buyer.key();
        ticket.for_sale = false;
        ticket.listing_price = 0;
        ticket.transfer_count += 1;

        emit!(TicketSold {
            ticket_id: ticket.key(),
            from: previous_owner,
            to: ctx.accounts.buyer.key(),
            price,
        });

        Ok(())
    }

    /// Deactivate an event
    pub fn deactivate_event(ctx: Context<DeactivateEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        require!(event.organizer == ctx.accounts.organizer.key(), ErrorCode::NotOrganizer);
        require!(event.active, ErrorCode::EventNotActive);

        event.active = false;

        emit!(EventDeactivated {
            event_id: event.key(),
        });

        Ok(())
    }
}

// ─── Account Contexts ───

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        payer = organizer,
        space = 8 + Event::INIT_SPACE,
        seeds = [b"event", organizer.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    
    #[account(mut)]
    pub organizer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTicket<'info> {
    #[account(mut)]
    pub event: Account<'info, Event>,

    #[account(
        init,
        payer = buyer,
        space = 8 + Ticket::INIT_SPACE,
        seeds = [b"ticket", mint.key().as_ref()],
        bump
    )]
    pub ticket: Account<'info, Ticket>,

    #[account(
        init,
        payer = buyer,
        mint::decimals = 0,
        mint::authority = mint,
        mint::freeze_authority = mint,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Organizer receives payment
    #[account(mut, address = event.organizer)]
    pub organizer_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ListTicket<'info> {
    #[account(mut, has_one = event)]
    pub ticket: Account<'info, Ticket>,

    pub event: Account<'info, Event>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub ticket: Account<'info, Ticket>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut, has_one = event)]
    pub ticket: Account<'info, Ticket>,

    pub event: Account<'info, Event>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller receives payment
    #[account(mut, address = ticket.current_owner)]
    pub seller: UncheckedAccount<'info>,

    /// CHECK: Organizer receives royalty
    #[account(mut, address = event.organizer)]
    pub organizer_account: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = ticket.mint,
        associated_token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = ticket.mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeactivateEvent<'info> {
    #[account(mut, has_one = organizer)]
    pub event: Account<'info, Event>,

    pub organizer: Signer<'info>,
}

// ─── State Accounts ───

#[account]
#[derive(InitSpace)]
pub struct Event {
    pub organizer: Pubkey,
    #[max_len(100)]
    pub name: String,
    pub original_price: u64,
    pub max_resale_price: u64,
    pub royalty_percentage: u8,
    pub active: bool,
    #[max_len(200)]
    pub event_uri: String,
    pub total_minted: u32,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Ticket {
    pub event: Pubkey,
    pub mint: Pubkey,
    pub original_owner: Pubkey,
    pub current_owner: Pubkey,
    pub original_price: u64,
    pub for_sale: bool,
    pub listing_price: u64,
    pub transfer_count: u32,
    pub bump: u8,
}

// ─── Events ───

#[event]
pub struct EventCreated {
    pub event_id: Pubkey,
    #[index]
    pub name: String,
    pub price: u64,
    pub organizer: Pubkey,
}

#[event]
pub struct TicketMinted {
    pub ticket_id: Pubkey,
    pub event_id: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
}

#[event]
pub struct TicketListed {
    pub ticket_id: Pubkey,
    pub owner: Pubkey,
    pub price: u64,
}

#[event]
pub struct ListingCancelled {
    pub ticket_id: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct TicketSold {
    pub ticket_id: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub price: u64,
}

#[event]
pub struct EventDeactivated {
    pub event_id: Pubkey,
}

// ─── Errors ───

#[error_code]
pub enum ErrorCode {
    #[msg("Royalty percentage cannot exceed 25%")]
    RoyaltyTooHigh,

    #[msg("Event is not active")]
    EventNotActive,

    #[msg("You do not own this ticket")]
    NotOwner,

    #[msg("Ticket is already listed for sale")]
    AlreadyListed,

    #[msg("Price exceeds maximum resale price")]
    PriceExceedsMax,

    #[msg("Ticket is not listed for sale")]
    NotForSale,

    #[msg("Ticket is not listed")]
    NotListed,

    #[msg("Cannot buy your own ticket")]
    CannotBuyOwnTicket,

    #[msg("You are not the event organizer")]
    NotOrganizer,

    #[msg("Invalid price")]
    InvalidPrice,

    #[msg("Invalid max resale price")]
    InvalidMaxResale,

    #[msg("Name too long (max 100 characters)")]
    NameTooLong,

    #[msg("URI too long (max 200 characters)")]
    UriTooLong,
}
