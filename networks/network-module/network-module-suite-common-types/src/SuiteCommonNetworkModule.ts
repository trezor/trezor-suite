import type { AddressValidator } from './AddressValidator';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';

export type SuiteCommonNetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;

    getNetworkConfig(symbol: TSymbol): SuiteCommonNetworkConfig;
};
