import {
    type NetworkSymbol,
    type StakingProductId,
    type StakingProductKind,
    type StakingProviderId,
} from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type StakingPool,
    type TronUnstakingBatch,
    type TronVote,
} from '@trezor/blockchain-link-types';

export type StakingPositionDetails =
    | { type: 'everstake-pool'; pool: StakingPool }
    | { type: 'tron-votes'; votes: TronVote[] }
    | {
          type: 'tron-unattributed';
          /** Votes for Super Representatives outside the catalog. */
          votes: TronVote[];
          unstakingBatches: TronUnstakingBatch[];
      };

// What an account holds with one staking product. Amounts are in the staked asset's units, as
// decimal strings. The buckets overlap where noted, so sum them only through `total`.
export type StakingPosition = {
    accountKey: AccountKey;
    /** Null for stake the protocol holds without a product of the catalog. */
    productId: StakingProductId | null;
    providerId: StakingProviderId | null;
    symbol: NetworkSymbol;
    asset: string;
    kind: StakingProductKind;
    /** Principal that is earning now, without rewards. */
    staked: string;
    /** The most an unstake may request now; with a pooled provider that is staked plus rewards. */
    withdrawable: string;
    /** Deposited and not earning yet. */
    pendingStake: string;
    /** The part of pendingStake already handed to validators and awaiting activation. */
    activating: string;
    /** Everything requested for unstake and not claimed yet, including the claimable part. */
    unstaking: string;
    /** The part of unstaking that can be claimed now. */
    claimable: string;
    /** Rewards earned so far; null when the provider cannot tell. */
    rewards: string | null;
    /** Rewards claimed by their own transaction instead of compounding into the stake. */
    claimableRewards: string;
    canClaim: boolean;
    /** withdrawable + pendingStake + unstaking: what the account would get back by exiting. */
    total: string;
    /** False when the total is already counted elsewhere, e.g. as a token or in the balance. */
    contributesToNativeBalance: boolean;
    details: StakingPositionDetails;
};

export type StakingPositionsSummary = {
    staked: string;
    withdrawable: string;
    pendingStake: string;
    activating: string;
    unstaking: string;
    claimable: string;
    rewards: string | null;
    claimableRewards: string;
    canClaim: boolean;
    total: string;
};
