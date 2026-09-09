import type { AddressValidator } from './AddressValidator';
import type { NamedAddressResolver } from './NamedAddressResolver';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';

export type SuiteCommonNetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<TSymbol>;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;

    isTestnet(symbol: TSymbol): boolean;

    getNetworkConfig(symbol: TSymbol): SuiteCommonNetworkConfig;
};
