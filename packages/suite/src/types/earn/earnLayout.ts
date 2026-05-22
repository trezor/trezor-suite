import { type EarnParams } from '@suite/router';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';

export type EarnLayoutInvalidReason =
    | 'missing-route-params'
    | 'missing-account'
    | 'missing-vault'
    | 'network-mismatch'
    | 'token-mismatch'
    | 'yield-opportunities-error';

export type EarnLayoutState =
    | { status: 'loading' }
    | { status: 'invalid'; reason: EarnLayoutInvalidReason }
    | { status: 'valid'; account: Account; routeParams: EarnParams; vault: YieldDto };

export type EarnLayoutFallbackState = Exclude<EarnLayoutState, { status: 'valid' }>;
