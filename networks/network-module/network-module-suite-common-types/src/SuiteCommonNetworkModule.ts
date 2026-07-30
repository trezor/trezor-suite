import type { NetworkSymbol } from '@trezor/network-module';

import type { AddressValidator } from './AddressValidator';
import type { Protocol } from './Protocol';

export type NetworkColor = `#${string}`;

export type SuiteCommonNetworkConfig = {
    readonly color: NetworkColor;
    readonly protocols: readonly Protocol[];
};

export type SuiteCommonNetworkModule = {
    addressValidator: AddressValidator<NetworkSymbol>;

    getSupportedNetworks: () => readonly NetworkSymbol[];

    isSupportedNetwork: (symbol: NetworkSymbol) => boolean;

    getNetworkConfig(symbol: NetworkSymbol): SuiteCommonNetworkConfig;

    getAccountSyncInterval(symbol: NetworkSymbol): number;
};
