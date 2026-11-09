import { type StakingOperation } from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

export const EVERSTAKE_POOLED_PRODUCT_POOL_ADDRESSES: Partial<Record<NetworkSymbol, string>> = {
    [asNetworkSymbol('eth')]: '0xD523794C879D9eC028960a231F866758e405bE34',
    [asNetworkSymbol('thod')]: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
};

// The selectors of the pool contract's stake, unstake and claimWithdrawRequest
// calls, as Blockbook parses them; the EVM kit owns the calldata itself.
export const EVERSTAKE_OPERATIONS_BY_METHOD_ID: Partial<Record<string, StakingOperation>> = {
    '0x3a29dbae': 'stake',
    '0x76ec871c': 'unstake',
    '0x33986ffa': 'withdraw',
};
