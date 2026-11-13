import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { IsWrappedNativeToken } from './IsWrappedNativeToken';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { AddressValidator } from './addressValidator/AddressValidator';
import type { MessageSigner } from './messageSigner/MessageSigner';
import type { NamedAddressResolver } from './namedAddressResolver/NamedAddressResolver';

export type SuiteCommonNetworkModule = {
    icon: NetworkAssetsModule;
    addressValidator: AddressValidator<NetworkSymbol>;
    isWrappedNativeToken?: IsWrappedNativeToken<NetworkSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<NetworkSymbol>;

    getSupportedNetworks: () => readonly NetworkSymbol[];

    getNetworkConfig(symbol: NetworkSymbol): SuiteCommonNetworkConfig;

    getAccountSyncInterval(symbol: NetworkSymbol): number;

    messageSigner?: MessageSigner<NetworkSymbol>;
};
