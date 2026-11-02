import type { StakingProvider, StakingProviderId } from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { curatedProvider } from './curated';
import { everstakeProvider } from './everstake';
import { externalProvider } from './external';
import { fivebinariesProvider } from './fivebinaries';
import { luganodesProvider } from './luganodes';
import { p2pProvider } from './p2p';

export const stakingProviders: readonly StakingProvider[] = [
    everstakeProvider,
    fivebinariesProvider,
    luganodesProvider,
    p2pProvider,
    externalProvider,
    curatedProvider,
];

export const getStakingProvider = (id: StakingProviderId): StakingProvider => {
    const provider = stakingProviders.find(candidate => candidate.id === id);

    if (provider === undefined) {
        throw new Error(`Unknown staking provider: ${id}`);
    }

    return provider;
};

export const findStakingProviderByIdentity = (
    symbol: NetworkSymbol,
    identity: string,
): StakingProvider | null =>
    stakingProviders.find(provider => provider.identities[symbol]?.includes(identity)) ?? null;
