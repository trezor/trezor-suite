export type StakingProviderId = 'everstake' | 'fivebinaries' | 'luganodes' | 'p2p.org';
export type YieldProviderId = 'morpho';
export type EarnProviderId = StakingProviderId | YieldProviderId;

export type EarnProviderMetadata = {
    id: EarnProviderId;
    name: string;
    companyName: string;
};

export type StakingProvider = EarnProviderMetadata & {
    id: StakingProviderId;
};

export type YieldProvider = EarnProviderMetadata & {
    id: YieldProviderId;
};

const EVERSTAKE_PROVIDER: StakingProvider = {
    id: 'everstake',
    name: 'Everstake',
    companyName: 'Everstake',
};

const FIVEBINARIES_PROVIDER: StakingProvider = {
    id: 'fivebinaries',
    name: 'FiveBinaries',
    companyName: 'FiveBinaries',
};

const LUGANODES_PROVIDER: StakingProvider = {
    id: 'luganodes',
    name: 'Luganodes',
    companyName: 'Luganodes',
};

const P2P_ORG_PROVIDER: StakingProvider = {
    id: 'p2p.org',
    name: 'P2P.org',
    companyName: 'P2P.org',
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

export const getStakingProvider = (id: StakingProviderId): StakingProvider => STAKING_PROVIDERS[id];

export const getEarnProvider = (id: EarnProviderId): EarnProviderMetadata => EARN_PROVIDERS[id];
