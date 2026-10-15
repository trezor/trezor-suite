import type { NetworkIconModule } from '@trezor/network-assets-types';
import type { IsWrappedNativeToken } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type ProductComponentsServices = {
    networks: {
        networkIcon: NetworkIconModule;
        isWrappedNativeToken: IsWrappedNativeToken<NetworkSymbol>;
    };
};
