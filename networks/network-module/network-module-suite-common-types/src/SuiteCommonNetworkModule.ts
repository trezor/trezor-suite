import type { AddressValidator } from './AddressValidator';

export type SuiteCommonNetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;
};
