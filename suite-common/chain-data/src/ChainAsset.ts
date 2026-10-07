import type { TokenStandard } from '@trezor/blockchain-link-types';
import type { ChainAccountRef } from '@trezor/network-module-suite-common-types';

import type { PortfolioAccount } from './PortfolioAccount';

/**
 * One asset one chain account holds: the network's native coin or one of its tokens.
 *
 * Assets are reported per chain account and never merged here. How to group them, per network as
 * today or one row per asset across networks, is the UI's decision.
 */
export type ChainAsset = {
    readonly accountId: PortfolioAccount['id'];
    readonly ref: ChainAccountRef;
    readonly kind: 'native' | 'token';

    /** Present exactly for tokens. */
    readonly contract?: string;
    readonly standard?: TokenStandard;
    readonly decimals?: number;
    readonly symbol?: string;
    readonly name?: string;

    /** Whole units of the asset. */
    readonly amount: string;

    /** `null` while the rate is unknown or loading. */
    readonly fiatValue: string | null;
};
