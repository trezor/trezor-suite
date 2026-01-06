export const TYPES = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    stellar: 'Stellar',
    cardano: 'Cardano',
    ripple: 'Ripple',
    tezos: 'Tezos',
    binance: 'Binance',
    solana: 'Solana',
} as const;

export type NetworkType = keyof typeof TYPES;

export const MODULES = [
    'cardano',
    'ethereum',
    'monero',
    'ripple',
    'solana',
    'stellar',
    'tezos',
] as const;

export type ModuleName = (typeof MODULES)[number];
