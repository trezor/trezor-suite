export const TYPES = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    eos: 'Eos',
    nem: 'NEM',
    stellar: 'Stellar',
    cardano: 'Cardano',
    ripple: 'Ripple',
    tezos: 'Tezos',
    tron: 'Tron',
    binance: 'Binance',
    solana: 'Solana',
} as const;

export type NetworkType = keyof typeof TYPES;

export const MODULES = [
    'cardano',
    'eos',
    'ethereum',
    'monero',
    'nem',
    'ripple',
    'solana',
    'stellar',
    'tezos',
    'tron',
] as const;

export type ModuleName = (typeof MODULES)[number];
