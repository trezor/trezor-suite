import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { EVERSTAKE_CONTRACTS, type EverstakeContracts } from '@trezor/network-ethereum/staking';
import { EVERSTAKE_VOTER_PUBKEYS } from '@trezor/network-solana/constants';
import { type PartialRecord } from '@trezor/type-utils';

import { type NetworkSymbol } from './networkTypes';
import {
    EVERSTAKE_POOLS,
    FIVE_BINARIES_POOLS,
    LUGANODES_TRON_SRS,
    P2P_ORG_TRON_SRS,
} from './stakingProviderConstants';

export type StakingProviderId = 'everstake' | 'fivebinaries' | 'luganodes' | 'p2p.org';
export type YieldProviderId = 'morpho';
export type EarnProviderId = StakingProviderId | YieldProviderId;

export type EarnProviderMetadata = {
    id: EarnProviderId;
    name: string;
    companyName: string;
};

export type EthereumStakingKind = 'pooled' | 'liquid';
export type EthereumStakingProviderContracts = EverstakeContracts;

export type EthereumStakingProvider = {
    kind: EthereumStakingKind;
    // Keyed by the networks the legacy config defines, so a typo in a key is still caught.
    contracts: PartialRecord<LegacyNetworkSymbol, EthereumStakingProviderContracts>;
};

export type StakingProvider = EarnProviderMetadata & {
    id: StakingProviderId;
    ethereum?: EthereumStakingProvider;
    solanaVoterPubkeys: readonly string[];
    cardanoPoolIds: readonly string[];
    tronSrAddresses: readonly string[];
};

export type YieldProvider = EarnProviderMetadata & {
    id: YieldProviderId;
};

const EVERSTAKE_PROVIDER: StakingProvider = {
    id: 'everstake',
    name: 'Everstake',
    companyName: 'Everstake',
    ethereum: {
        kind: 'pooled',
        contracts: {
            eth: EVERSTAKE_CONTRACTS[1],
            thod: EVERSTAKE_CONTRACTS[560048],
        },
    },
    solanaVoterPubkeys: EVERSTAKE_VOTER_PUBKEYS,
    cardanoPoolIds: EVERSTAKE_POOLS,
    tronSrAddresses: [],
};

const FIVEBINARIES_PROVIDER: StakingProvider = {
    id: 'fivebinaries',
    name: 'FiveBinaries',
    companyName: 'FiveBinaries',
    solanaVoterPubkeys: [],
    cardanoPoolIds: FIVE_BINARIES_POOLS,
    tronSrAddresses: [],
};

const LUGANODES_PROVIDER: StakingProvider = {
    id: 'luganodes',
    name: 'Luganodes',
    companyName: 'Luganodes',
    solanaVoterPubkeys: [],
    cardanoPoolIds: [],
    tronSrAddresses: LUGANODES_TRON_SRS,
};

const P2P_ORG_PROVIDER: StakingProvider = {
    id: 'p2p.org',
    name: 'P2P.org',
    companyName: 'P2P.org',
    solanaVoterPubkeys: [],
    cardanoPoolIds: [],
    tronSrAddresses: P2P_ORG_TRON_SRS,
};

const MORPHO_PROVIDER: YieldProvider = {
    id: 'morpho',
    name: 'Morpho',
    companyName: 'Morpho',
};

export const STAKING_PROVIDERS: Readonly<Record<StakingProviderId, StakingProvider>> = {
    everstake: EVERSTAKE_PROVIDER,
    fivebinaries: FIVEBINARIES_PROVIDER,
    luganodes: LUGANODES_PROVIDER,
    'p2p.org': P2P_ORG_PROVIDER,
};

export const YIELD_PROVIDERS: Readonly<Record<YieldProviderId, YieldProvider>> = {
    morpho: MORPHO_PROVIDER,
};

export const EARN_PROVIDERS: Readonly<Record<EarnProviderId, EarnProviderMetadata>> = {
    ...STAKING_PROVIDERS,
    ...YIELD_PROVIDERS,
};

const stakingProviders: readonly StakingProvider[] = Object.values(STAKING_PROVIDERS);

export const getStakingProvider = (id: StakingProviderId): StakingProvider => STAKING_PROVIDERS[id];

export const getEarnProvider = (id: EarnProviderId): EarnProviderMetadata => EARN_PROVIDERS[id];

export const getEthereumStakingProviderIds = (symbol: NetworkSymbol): StakingProviderId[] =>
    stakingProviders
        .filter(
            provider => provider.ethereum?.contracts[symbol as LegacyNetworkSymbol] !== undefined,
        )
        .map(provider => provider.id);

const hasEthereumContract = (
    provider: StakingProvider,
    symbol: NetworkSymbol,
    contractAddress: string,
): boolean => {
    const contracts = provider.ethereum?.contracts[symbol as LegacyNetworkSymbol];
    if (!contracts) return false;

    const normalized = contractAddress.toLowerCase();

    return Object.values(contracts).some(address => address.toLowerCase() === normalized);
};

export const getStakingProviderByEthereumContract = (
    symbol: NetworkSymbol,
    contractAddress: string,
): StakingProvider | undefined =>
    stakingProviders.find(provider => hasEthereumContract(provider, symbol, contractAddress));

export const getStakingProviderBySolanaVoterPubkey = (
    voterPubkey: string,
): StakingProvider | undefined =>
    stakingProviders.find(provider => provider.solanaVoterPubkeys.includes(voterPubkey));

export const getStakingProviderByCardanoPoolId = (poolId: string): StakingProvider | undefined =>
    stakingProviders.find(provider => provider.cardanoPoolIds.includes(poolId));

export const getStakingProviderByTronSrAddress = (srAddress: string): StakingProvider | undefined =>
    stakingProviders.find(provider => provider.tronSrAddresses.includes(srAddress));
