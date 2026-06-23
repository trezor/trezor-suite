export const supportedCoins = ['sol', 'dsol'] as const;

export type SolanaSupportedCoin = (typeof supportedCoins)[number];

export const getSupportedCoins = (): readonly SolanaSupportedCoin[] => supportedCoins;

export const isSupportedCoin = (symbol: string): symbol is SolanaSupportedCoin =>
    supportedCoins.includes(symbol as SolanaSupportedCoin);
