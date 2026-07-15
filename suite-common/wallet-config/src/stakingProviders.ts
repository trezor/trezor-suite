import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    LUGANODES_TRON_SRS,
    P2P_ORG_TRON_SRS,
} from '@suite-common/wallet-constants';
import { EVERSTAKE_VOTER_PUBKEYS } from '@trezor/network-solana/constants';

type StakingProviderId = 'everstake' | 'fivebinaries' | 'luganodes' | 'p2p.org';

export type StakingProvider = {
    id: StakingProviderId;
    name: string;
    solanaVoterPubkeys: string[];
    cardanoPoolIds: string[];
    ethereumPoolNames: string[];
    tronSrAddresses: string[];
};

const EVERSTAKE_PROVIDER: StakingProvider = {
    id: 'everstake',
    name: 'Everstake',
    solanaVoterPubkeys: EVERSTAKE_VOTER_PUBKEYS,
    cardanoPoolIds: EVERSTAKE_POOLS,
    ethereumPoolNames: ['Everstake'],
    tronSrAddresses: [],
};

const FIVEBINARIES_PROVIDER: StakingProvider = {
    id: 'fivebinaries',
    name: 'FiveBinaries',
    solanaVoterPubkeys: [],
    cardanoPoolIds: FIVE_BINARIES_POOLS,
    ethereumPoolNames: [],
    tronSrAddresses: [],
};

const LUGANODES_PROVIDER: StakingProvider = {
    id: 'luganodes',
    name: 'Luganodes',
    solanaVoterPubkeys: [],
    cardanoPoolIds: [],
    ethereumPoolNames: [],
    tronSrAddresses: LUGANODES_TRON_SRS,
};

const P2P_ORG_PROVIDER: StakingProvider = {
    id: 'p2p.org',
    name: 'P2P.org',
    solanaVoterPubkeys: [],
    cardanoPoolIds: [],
    ethereumPoolNames: [],
    tronSrAddresses: P2P_ORG_TRON_SRS,
};

const STAKING_PROVIDERS: readonly StakingProvider[] = [
    EVERSTAKE_PROVIDER,
    FIVEBINARIES_PROVIDER,
    LUGANODES_PROVIDER,
    P2P_ORG_PROVIDER,
];

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

export const getStakingProviderByTronSrAddress = (srAddress: string): StakingProvider | undefined =>
    STAKING_PROVIDERS.find(provider => provider.tronSrAddresses.includes(srAddress));
