import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { AddressValidator } from './AddressValidator';
import type { IsWrappedNativeToken } from './IsWrappedNativeToken';
import type { NamedAddressResolver } from './NamedAddressResolver';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { WalletConnectAdapter } from './WalletConnectAdapter';

export type SuiteCommonNetworkModule = {
    icon: NetworkAssetsModule;
    addressValidator: AddressValidator<NetworkSymbol>;
    isWrappedNativeToken?: IsWrappedNativeToken<NetworkSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<NetworkSymbol>;

    /** Only for networks offered to dApps; see `WalletConnectAdapter`. */
    walletConnectAdapter?: WalletConnectAdapter<NetworkSymbol>;

    getSupportedNetworks: () => readonly NetworkSymbol[];

    getNetworkConfig(symbol: NetworkSymbol): SuiteCommonNetworkConfig;

    getAccountSyncInterval(symbol: NetworkSymbol): number;
};
