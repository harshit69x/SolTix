-- Fix invalid organizer wallets and prevent future malformed inserts.
-- Run this in Supabase SQL Editor after schema.sql.
--
-- 1) Replace invalid wallets with your devnet wallet (edit the value below first).
-- 2) Add a format check constraint for future rows.

-- TODO: replace with your own valid devnet wallet address.
-- Example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
DO $$
DECLARE
  fallback_wallet TEXT := 'REPLACE_WITH_VALID_DEVNET_WALLET';
BEGIN
  IF fallback_wallet = 'REPLACE_WITH_VALID_DEVNET_WALLET' THEN
    RAISE EXCEPTION 'Please replace fallback_wallet with a valid devnet wallet before running this script.';
  END IF;

  -- Basic Solana base58 format guard (32-44 chars, no 0/O/I/l).
  UPDATE events
  SET organizer_wallet = fallback_wallet
  WHERE organizer_wallet !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$';
END $$;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_organizer_wallet_base58_chk;

ALTER TABLE events
  ADD CONSTRAINT events_organizer_wallet_base58_chk
  CHECK (organizer_wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$');
