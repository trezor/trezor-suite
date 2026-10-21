import {
    type EthereumStakingKind,
    type NetworkSymbol,
    type StakingProviderId,
} from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { type StakingPool } from '@trezor/blockchain-link-types';

export type StakingPositionDetails = { providerId: 'everstake'; pool: StakingPool };

// What an account holds with one provider. Amounts are in ether, as decimal strings.
// The buckets overlap where noted, so sum them only through `total`.
export type StakingPosition = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    providerId: StakingProviderId;
    kind: EthereumStakingKind;
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
    canClaim: boolean;
    /** withdrawable + pendingStake + unstaking: what the account would get back by exiting. */
    total: string;
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
    canClaim: boolean;
    total: string;
};
