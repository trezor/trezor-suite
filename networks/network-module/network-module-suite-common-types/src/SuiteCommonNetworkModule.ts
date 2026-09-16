import type { NetworkSymbol } from '@trezor/network-module';

import type { AddressValidator } from './AddressValidator';
import type { NamedAddressResolver } from './NamedAddressResolver';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';

export type SuiteCommonNetworkModule = {
    addressValidator: AddressValidator<NetworkSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<NetworkSymbol>;

    getSupportedNetworks: () => readonly NetworkSymbol[];

    getNetworkConfig(symbol: NetworkSymbol): SuiteCommonNetworkConfig;
};
