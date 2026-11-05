import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

export const EVERSTAKE_POOLED_PRODUCT_POOL_ADDRESSES: Partial<Record<NetworkSymbol, string>> = {
    [asNetworkSymbol('eth')]: '0xD523794C879D9eC028960a231F866758e405bE34',
    [asNetworkSymbol('thod')]: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
};
