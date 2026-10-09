import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import { createNetworkIcon } from '@trezor/network-module-suite-common-types';
import { type RippleNetworkSymbol, supportedRippleNetworks } from '@trezor/network-ripple-types';

export type RippleIconDeps = {
    rippleAssets: NetworkAssetsModule<RippleNetworkSymbol>;
};

export const createRippleIcon = (deps: RippleIconDeps): NetworkIcon =>
    createNetworkIcon<RippleNetworkSymbol>({
        supportedNetworks: supportedRippleNetworks,
        assets: deps.rippleAssets,
    });
