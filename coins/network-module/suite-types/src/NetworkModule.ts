import type { AddressValidator } from './AddressValidator';

export type NetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    getSupportedCoins: () => readonly TSymbol[];

    isSupportedCoin: (symbol: string) => symbol is TSymbol;
};
