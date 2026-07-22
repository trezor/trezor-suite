import type { AddressValidator } from './AddressValidator';

export type NetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    getSupportedNetwork: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;
};
