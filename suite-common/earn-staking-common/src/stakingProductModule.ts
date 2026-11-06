import type { NetworkSymbol } from '@trezor/network-module-types';

import type { StakingProductAdapter } from './stakingProductAdapter';

/**
 * One network family's staking products behind a dynamic import.
 *
 * The apps register modules, not adapters: a module names the networks its products serve and
 * loads its code, which the bundler keeps out of the initial bundle, only once one of those
 * networks is enabled. Every adapter a module loads must serve one of its declared networks,
 * and every declared network must get at least one adapter.
 *
 * @serviceContract
 */
export type StakingProductModule = {
    networkSymbols: readonly NetworkSymbol[];
    load: () => Promise<readonly StakingProductAdapter[]>;
};
