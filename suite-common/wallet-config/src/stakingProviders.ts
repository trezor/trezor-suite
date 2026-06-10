import { EVERSTAKE_POOLS, FIVE_BINARIES_POOLS } from '@suite-common/wallet-constants';
import { EVERSTAKE_VOTER_PUBKEYS } from '@trezor/coins-solana/constants';

type StakingProviderId = 'everstake' | 'fivebinaries';

export type StakingProvider = {
    id: StakingProviderId;
    name: string;
    solanaVoterPubkeys: string[];
    cardanoPoolIds: string[];
    ethereumPoolNames: string[];
};

const EVERSTAKE_PROVIDER: StakingProvider = {
    id: 'everstake',
    name: 'Everstake',
    solanaVoterPubkeys: EVERSTAKE_VOTER_PUBKEYS,
    cardanoPoolIds: EVERSTAKE_POOLS,
    ethereumPoolNames: ['Everstake'],
};

const FIVEBINARIES_PROVIDER: StakingProvider = {
    id: 'fivebinaries',
    name: 'FiveBinaries',
    solanaVoterPubkeys: [],
    cardanoPoolIds: FIVE_BINARIES_POOLS,
    ethereumPoolNames: [],
};

const STAKING_PROVIDERS: readonly StakingProvider[] = [EVERSTAKE_PROVIDER, FIVEBINARIES_PROVIDER];

export const getStakingProviderBySolanaVoterPubkey = (
    voterPubkey: string,
): StakingProvider | undefined =>
    STAKING_PROVIDERS.find(provider => provider.solanaVoterPubkeys.includes(voterPubkey));

export const getStakingProviderByCardanoPoolId = (poolId: string): StakingProvider | undefined =>
    STAKING_PROVIDERS.find(provider => provider.cardanoPoolIds.includes(poolId));

export const getStakingProviderByEthereumPoolName = (
    poolName: string,
): StakingProvider | undefined =>
    STAKING_PROVIDERS.find(provider => provider.ethereumPoolNames.includes(poolName));
