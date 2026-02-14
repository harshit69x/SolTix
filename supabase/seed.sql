-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SolTix Seed Data — Production-Quality Events              ║
-- ║  Run this AFTER schema.sql in your Supabase SQL Editor     ║
-- ╚══════════════════════════════════════════════════════════════╝

INSERT INTO events (title, description, date, time, venue, location, image_url, organizer_wallet, organizer_name, ticket_price, total_tickets, tickets_sold, max_resale_price, royalty_percentage, category, status, metadata_uri)
VALUES
-- ─── Conferences ───
(
  'Solana Breakpoint 2026',
  'The premier annual conference for the Solana ecosystem. Join 5,000+ developers, founders, investors, and enthusiasts for three days of keynotes, deep-dive technical workshops, hackathon showcases, and world-class networking. Topics include DePIN, DeFi 2.0, compressed NFTs, ZK proofs on Solana, and the future of consumer crypto.',
  '2026-04-15', '09:00 AM',
  'Lisbon Congress Center', 'Lisbon, Portugal',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'Solana Foundation',
  2.5, 5000, 3420, 5.0, 5,
  'conference', 'upcoming', ''
),
(
  'ETH × SOL Interop Summit',
  'A cross-ecosystem summit exploring bridges, interoperability standards, and multi-chain application architecture. Featuring panels with core contributors from both ecosystems discussing Wormhole, LayerZero, and native cross-chain messaging.',
  '2026-05-22', '10:00 AM',
  'Marina Bay Sands Convention Centre', 'Singapore',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Interop Alliance',
  1.8, 3000, 1850, 3.6, 6,
  'conference', 'upcoming', ''
),
(
  'DePIN World Conference',
  'Decentralized Physical Infrastructure Networks are reshaping how we build real-world systems. This two-day conference covers Helium, Hivemapper, Render Network, and dozens of emerging DePIN protocols building on Solana.',
  '2026-06-10', '09:30 AM',
  'Javits Center', 'New York, NY',
  'https://images.unsplash.com/photo-1591115765373-5f9cf1da1776?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'DePIN Foundation',
  3.0, 4000, 2100, 6.0, 5,
  'conference', 'upcoming', ''
),

-- ─── Festivals ───
(
  'DeFi Summer Festival 2026',
  'A three-day outdoor music and crypto festival celebrating the intersection of DeFi and culture. Featuring 40+ live performances, hackathon stages, DeFi protocol showcases, and experiential art installations powered by on-chain generative algorithms.',
  '2026-06-20', '12:00 PM',
  'Zilker Park', 'Austin, TX',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'DeFi Alliance',
  1.2, 10000, 6800, 2.4, 8,
  'festival', 'upcoming', ''
),
(
  'Solana Beach Fest',
  'Sun, surf, and Solana — a beachside festival merging Web3 culture with coastal vibes. NFT art exhibitions on the sand, acoustic sets from crypto-native artists, validator meetups, and sunrise yoga sessions with staking rewards.',
  '2026-08-15', '10:00 AM',
  'Copacabana Beach', 'Rio de Janeiro, Brazil',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Sol Beach Collective',
  0.8, 8000, 3200, 1.6, 7,
  'festival', 'upcoming', ''
),

-- ─── Workshops ───
(
  'NFT Art Workshop: From Canvas to Chain',
  'Hands-on workshop teaching artists how to create, mint, and sell NFT art on Solana using Metaplex. Covers compressed NFTs, royalty enforcement, collection standards, and marketplace strategies. All skill levels welcome — laptops provided.',
  '2026-03-10', '02:00 PM',
  'Creative Hub Downtown', 'Berlin, Germany',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
  '9aE476sH92Vb7W4F2qiaoWXVV5vTtGiH2jXDHYGr3RvU',
  'Digital Art Collective',
  0.5, 50, 42, 1.0, 10,
  'workshop', 'upcoming', ''
),
(
  'Anchor Framework Bootcamp',
  'Two-day intensive bootcamp on building Solana programs with Anchor. Day 1 covers program architecture, PDAs, CPIs, and testing. Day 2 is a hands-on build session where attendees ship a complete DeFi protocol. Prerequisites: basic Rust knowledge.',
  '2026-04-05', '09:00 AM',
  'WeWork Coworking Space', 'London, UK',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Solana Developer Academy',
  1.0, 80, 65, 2.0, 5,
  'workshop', 'upcoming', ''
),
(
  'Zero-Knowledge Proofs on Solana',
  'An advanced workshop exploring ZK-proof integration on Solana. Topics include Groth16 verification, Light Protocol, ZK-compression, and privacy-preserving DeFi applications. Includes hands-on coding exercises with real proof circuits.',
  '2026-05-18', '10:00 AM',
  'ETH Zurich Campus', 'Zurich, Switzerland',
  'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'ZK Research Labs',
  1.5, 40, 28, 3.0, 8,
  'workshop', 'upcoming', ''
),

-- ─── Concerts ───
(
  'Crypto Concert: RAC Live',
  'Grammy-winning artist RAC performs an exclusive set powered entirely by NFT tickets on Solana. Each ticket is a unique generative art piece that doubles as memorabilia. VIP holders get backstage access and a 1-of-1 signed NFT.',
  '2026-07-12', '08:00 PM',
  'The Wiltern', 'Los Angeles, CA',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'CryptoBeats Inc.',
  3.0, 8000, 5500, 6.0, 7,
  'concert', 'upcoming', ''
),
(
  'Deadmau5 × Solana: Decentralized Tour',
  'Electronic music legend Deadmau5 brings his iconic cube show to Web3 with Solana-powered NFT ticketing. Dynamic ticket art evolves based on your attendance streak. Loyalty holders unlock exclusive merch drops.',
  '2026-09-20', '09:00 PM',
  'Avant Gardner', 'Brooklyn, NY',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'mau5trap',
  4.0, 6000, 4200, 8.0, 10,
  'concert', 'upcoming', ''
),
(
  'Bonobo: Migration Tour',
  'Bonobo''s immersive live show combines downtempo electronica with stunning visual projections. This Solana-ticketed event features a POAP for attendees and token-gated after-party access.',
  '2026-08-08', '07:30 PM',
  'Royal Albert Hall', 'London, UK',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Ninja Tune',
  2.2, 5000, 3800, 4.4, 6,
  'concert', 'upcoming', ''
),

-- ─── Sports ───
(
  'Web3 Gaming World Championship',
  'The biggest competitive gaming event in Web3. Featuring tournaments across Star Atlas, Aurory, and Genopets with prize pools distributed as SPL tokens. Live-streamed to 500K+ viewers with on-chain prediction markets.',
  '2026-05-05', '10:00 AM',
  'COEX Convention Center', 'Seoul, South Korea',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
  '2WLbb3GJkMpsJnBRHnKGotfhbJuhq2EKByDBSvS6hJeN',
  'GameFi Labs',
  0.8, 2000, 1200, 1.6, 5,
  'sports', 'upcoming', ''
),
(
  'Crypto Basketball Pro-Am',
  'NBA legends and crypto founders face off in a charity basketball tournament. All proceeds go to blockchain education nonprofits. NFT tickets include a digital collectible card of your favorite player.',
  '2026-06-28', '04:00 PM',
  'Crypto.com Arena', 'Los Angeles, CA',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Web3 Sports League',
  1.5, 15000, 8900, 3.0, 5,
  'sports', 'upcoming', ''
),

-- ─── Meetups ───
(
  'Solana Developer Meetup: SF',
  'Monthly meetup for the Bay Area Solana developer community. This month: lightning talks on Blinks, Actions, and the new Token Extensions standard, followed by open networking with pizza and drinks.',
  '2026-03-25', '06:30 PM',
  'GitHub HQ', 'San Francisco, CA',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  'SF Solana Devs',
  0, 100, 78, 0, 0,
  'meetup', 'upcoming', ''
),
(
  'Women in Web3: Tokyo Chapter',
  'A networking and mentorship event for women builders in the Solana ecosystem. Panel discussions on breaking into blockchain, followed by a workshop on your first Solana transaction. All genders welcome as allies.',
  '2026-04-12', '02:00 PM',
  'WeWork Roppongi', 'Tokyo, Japan',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Women in Web3 Japan',
  0, 60, 45, 0, 0,
  'meetup', 'upcoming', ''
),
(
  'Validator Operators Roundtable',
  'An invite-only roundtable for Solana validator operators to discuss MEV strategies, Firedancer migration, Jito tips optimization, and the economics of running validators. Includes a hands-on session on monitoring and alerting.',
  '2026-05-30', '11:00 AM',
  'Hacker House', 'Dubai, UAE',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  '2HZ7ojC5xKUdDBoQtTSGSMf8qYoMX8VzC1LvE2bbUozF',
  'Solana Validators DAO',
  0.3, 30, 22, 0.6, 3,
  'meetup', 'upcoming', ''
);
