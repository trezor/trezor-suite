import {
    type EthereumStakingKind,
    type NetworkSymbol,
    type StakingProviderId,
} from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { type StakingPool } from '@trezor/blockchain-link-types';

export type StakingPositionDetails = { providerId: 'everstake'; pool: StakingPool };

// What an account holds with one provider. Amounts are in ether, as decimal strings.
export type StakingPosition = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    providerId: StakingProviderId;
    kind: EthereumStakingKind;
    staked: string;
    pendingStake: string;
    unstaking: string;
    claimable: string;
    rewards: string | null;
    canClaim: boolean;
    total: string;
    details: StakingPositionDetails;
};

export type StakingPositionsSummary = {
    staked: string;
    pendingStake: string;
    unstaking: string;
    claimable: string;
    rewards: string | null;
    canClaim: boolean;
    total: string;
};
