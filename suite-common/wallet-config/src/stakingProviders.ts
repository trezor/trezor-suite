import { EVERSTAKE_POOLS, FIVE_BINARIES_POOLS } from '@suite-common/wallet-constants';

export type StakingProviderId = 'everstake' | 'fivebinaries';

export type StakingProvider = {
    id: StakingProviderId;
    name: string;
    solanaVoterPubkeys: string[];
    cardanoPoolIds: string[];
    ethereumPoolNames: string[];
};

export const EVERSTAKE_SOLANA_MAINNET_VALIDATOR = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
export const EVERSTAKE_SOLANA_DEVNET_VALIDATOR = 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN';

export const EVERSTAKE_PROVIDER: StakingProvider = {
    id: 'everstake',
    name: 'Everstake',
    solanaVoterPubkeys: [EVERSTAKE_SOLANA_MAINNET_VALIDATOR, EVERSTAKE_SOLANA_DEVNET_VALIDATOR],
    cardanoPoolIds: EVERSTAKE_POOLS,
    ethereumPoolNames: ['Everstake'],
};

export const FIVEBINARIES_PROVIDER: StakingProvider = {
    id: 'fivebinaries',
    name: 'FiveBinaries',
    solanaVoterPubkeys: [],
    cardanoPoolIds: FIVE_BINARIES_POOLS,
    ethereumPoolNames: [],
};

export const STAKING_PROVIDERS: readonly StakingProvider[] = [
    EVERSTAKE_PROVIDER,
    FIVEBINARIES_PROVIDER,
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
