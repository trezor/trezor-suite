export const supportedCoins = ['xlm', 'txlm'] as const;

export type StellarSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly StellarSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is StellarSupportedCoin =>
    supportedCoins.includes(symbol as StellarSupportedCoin);
