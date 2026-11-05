import type { StakingProvider } from '@suite-common/earn-staking-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type TronRepresentative = {
    address: string;
    provider: StakingProvider;
};

export type GetTronRepresentativesParams = {
    networkSymbol: NetworkSymbol;
    providers: readonly StakingProvider[];
};

export const getTronRepresentatives = ({
    networkSymbol,
    providers,
}: GetTronRepresentativesParams): readonly TronRepresentative[] =>
    providers.flatMap(provider =>
        provider.status === 'active'
            ? (provider.identities[networkSymbol] ?? []).map(address => ({ address, provider }))
            : [],
    );
