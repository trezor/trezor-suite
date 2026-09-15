import type { AddressValidator } from './AddressValidator';
import type { NamedAddressResolver } from './NamedAddressResolver';
import type { NetworkIcon } from './NetworkIcon';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';

export type SuiteCommonNetworkModule<TSymbol extends string> = {
    icon: NetworkIcon<TSymbol>;

    addressValidator: AddressValidator<TSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<TSymbol>;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;

    getNetworkConfig(symbol: TSymbol): SuiteCommonNetworkConfig;
};
