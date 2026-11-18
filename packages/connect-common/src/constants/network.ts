export const TYPES = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    stellar: 'Stellar',
    cardano: 'Cardano',
    ripple: 'Ripple',
    tron: 'Tron',
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
    'tron',
] as const;

export type ModuleName = (typeof MODULES)[number];
