import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import { asNetworkSymbol } from './networkTypes';
import {
    EARN_PROVIDERS,
    STAKING_PROVIDERS,
    getEthereumStakingProviderIds,
    getStakingProviderByEthereumContract,
} from './stakingProviders';

const ethSymbol = asNetworkSymbol('eth');
const thodSymbol = asNetworkSymbol('thod');

describe('STAKING_PROVIDERS', () => {
    it('keys every provider by its own id', () => {
        Object.entries(STAKING_PROVIDERS).forEach(([key, provider]) => {
            expect(provider.id).toBe(key);
        });
        Object.entries(EARN_PROVIDERS).forEach(([key, provider]) => {
            expect(provider.id).toBe(key);
        });
    });

    it('has Ethereum contracts on mainnet and Hoodi for every Ethereum provider', () => {
        Object.values(STAKING_PROVIDERS)
            .filter(provider => provider.ethereum)
            .forEach(provider => {
                expect(provider.ethereum?.contracts.eth).toBeDefined();
                expect(provider.ethereum?.contracts.thod).toBeDefined();
            });
    });
});

describe(getEthereumStakingProviderIds.name, () => {
    it('lists Everstake for eth and thod', () => {
        expect(getEthereumStakingProviderIds(ethSymbol)).toEqual(['everstake']);
        expect(getEthereumStakingProviderIds(thodSymbol)).toEqual(['everstake']);
    });

    it('lists nothing for a network without Ethereum staking', () => {
        expect(getEthereumStakingProviderIds(asNetworkSymbol('btc'))).toEqual([]);
    });
});

describe(getStakingProviderByEthereumContract.name, () => {
    it('matches the accounting contract regardless of case', () => {
        const accounting = EVERSTAKE_CONTRACTS[1].accounting.toLowerCase();

        expect(getStakingProviderByEthereumContract(ethSymbol, accounting)?.id).toBe('everstake');
    });

    it('matches the pool contract', () => {
        expect(
            getStakingProviderByEthereumContract(thodSymbol, EVERSTAKE_CONTRACTS[560048].pool)?.id,
        ).toBe('everstake');
    });

    it('does not match a deployment from another network', () => {
        expect(
            getStakingProviderByEthereumContract(thodSymbol, EVERSTAKE_CONTRACTS[1].accounting),
        ).toBeUndefined();
    });

    it('returns undefined for an unknown contract', () => {
        expect(
            getStakingProviderByEthereumContract(
                ethSymbol,
                '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
            ),
        ).toBeUndefined();
    });
});
