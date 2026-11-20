import { stakingProviderIdSchema, stakingProviderSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { curatedProvider } from './curated';
import { everstakeProvider } from './everstake';
import { externalProvider } from './external';
import { fivebinariesProvider } from './fivebinaries';
import { luganodesProvider } from './luganodes';
import { p2pProvider } from './p2p';
import {
    findStakingProviderByIdentity,
    getStakingProvider,
    stakingProviders,
} from './stakingProviders';

describe('stakingProviders', () => {
    it('lists every provider once, parsed', () => {
        expect(stakingProviders).toEqual([
            everstakeProvider,
            fivebinariesProvider,
            luganodesProvider,
            p2pProvider,
            externalProvider,
            curatedProvider,
        ]);
        stakingProviders.forEach(provider => {
            expect(stakingProviderSchema.safeParse(provider).success).toBe(true);
        });
        expect(new Set(stakingProviders.map(provider => provider.id)).size).toBe(
            stakingProviders.length,
        );
    });

    it('keeps every identity unique within a network', () => {
        const seen = new Set<string>();

        stakingProviders.forEach(provider => {
            Object.entries(provider.identities).forEach(([symbol, identities]) => {
                identities?.forEach(identity => {
                    const key = `${symbol}:${identity}`;

                    expect(seen.has(key)).toBe(false);
                    seen.add(key);
                });
            });
        });
    });

    it('gives the pseudo-providers no identities and no links', () => {
        expect(externalProvider).toEqual({
            id: 'external',
            name: 'External',
            status: 'external',
            identities: {},
        });
        expect(curatedProvider).toEqual({
            id: 'curated',
            name: 'Trezor',
            status: 'curated',
            identities: {},
        });
    });

    it('marks FiveBinaries as retired and the operators as active', () => {
        expect(fivebinariesProvider.status).toBe('retired');
        expect(
            [everstakeProvider, luganodesProvider, p2pProvider].map(({ status }) => status),
        ).toEqual(['active', 'active', 'active']);
    });
});

describe('getStakingProvider', () => {
    it('returns the provider with the id', () => {
        expect(getStakingProvider(stakingProviderIdSchema.parse('p2p.org'))).toBe(p2pProvider);
    });

    it('throws for an unknown id', () => {
        expect(() => getStakingProvider(stakingProviderIdSchema.parse('lido'))).toThrow(
            'Unknown staking provider: lido',
        );
    });
});

describe('findStakingProviderByIdentity', () => {
    it.each([
        ['eth', 'Everstake', everstakeProvider],
        ['thod', 'Everstake', everstakeProvider],
        ['sol', '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF', everstakeProvider],
        ['dsol', 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN', everstakeProvider],
        ['ada', 'pool1xflehvzad4wr6rrvf6eea65jst5af0r4k0rh4xvmnqgvkzt3xjt', everstakeProvider],
        ['ada', 'pool1k2qhlrrweu8fecd4hx4hn22lv00nrd3rjdxj6durax7m78q7ynu', fivebinariesProvider],
        ['trx', 'TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9', luganodesProvider],
        ['trx', 'TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij', p2pProvider],
    ])('attributes %s %s', (symbol, identity, provider) => {
        expect(findStakingProviderByIdentity(asNetworkSymbol(symbol), identity)).toBe(provider);
    });

    it.each([
        ['eth', '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF'],
        ['sol', 'Everstake'],
        ['ada', 'pool1unknown'],
        ['btc', 'Everstake'],
    ])('returns null for %s %s', (symbol, identity) => {
        expect(findStakingProviderByIdentity(asNetworkSymbol(symbol), identity)).toBeNull();
    });
});
