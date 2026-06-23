import type { AddressValidator } from './AddressValidator';

export type NetworkModule = {
    addressValidator: AddressValidator;

    getSupportedCoins: () => string[];

    isSupportedCoin: (symbol: string) => symbol is string;
};
