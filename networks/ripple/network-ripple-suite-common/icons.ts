import type { NetworkIcon } from '@trezor/network-module-suite-common-types';
import type { RippleNetworkSymbol } from '@trezor/network-ripple/constants';
import { rippleAssets } from '@trezor/network-ripple-assets';

export const rippleIcon: NetworkIcon<RippleNetworkSymbol> = {
    getIcons: rippleAssets.getIcons,
    getTokenLogoIdentifiers: (_symbol, contract) => [contract],
};
