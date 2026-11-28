import { type PageName } from '@suite/router';

import { resolveRouteComponentName } from './resolveRouteComponentName';

const components = { 'suite-index': 1, 'wallet-tokens': 2 } as unknown as Record<PageName, unknown>;

describe('resolveRouteComponentName', () => {
    it('returns the page of a route that has one', () => {
        expect(resolveRouteComponentName('wallet-tokens', components)).toBe('wallet-tokens');
    });

    it('returns the parent page of a nested route', () => {
        expect(resolveRouteComponentName('wallet-tokens-hidden', components)).toBe('wallet-tokens');
    });

    it('returns nothing for a route without a page', () => {
        expect(resolveRouteComponentName('suite-bridge', components)).toBeUndefined();
        expect(resolveRouteComponentName(undefined, components)).toBeUndefined();
    });
});
