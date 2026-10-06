import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';

export type EarnLayoutInvalidReason =
    | 'missing-route-params'
    | 'missing-account'
    | 'missing-vault'
    | 'network-mismatch'
    | 'token-mismatch'
    | 'firmware-not-supported'
    | 'yield-opportunities-error';

export type EarnLayoutState =
    | { status: 'loading' }
    | { status: 'invalid'; reason: EarnLayoutInvalidReason }
    | { status: 'valid'; account: Account; vault: YieldDtoV2 };

export type EarnLayoutFallbackState = Exclude<EarnLayoutState, { status: 'valid' }>;
