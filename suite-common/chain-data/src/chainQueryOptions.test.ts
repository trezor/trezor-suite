import { CONFIDENTIAL_QUERY_META, skipToken } from '@suite-common/react-query';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    getChainAccountBalanceQueryOptions,
    getNativeFiatRateQueryOptions,
} from './chainQueryOptions';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const { network } = createFakeChainNetwork({
    symbol: asNetworkSymbol('eth'),
    balances: {},
    rate: null,
});
const ref = {
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xabc',
    accountType: 'normal',
    connectionIdentity: 'session',
} as const;

describe('chain query options', () => {
    it('keys a balance by network, backend and descriptor only', () => {
        const options = getChainAccountBalanceQueryOptions({ network, ref, enabled: true });

        expect(options.queryKey).toEqual([
            'chain',
            'eth',
            'blockbook',
            'account',
            '0xabc',
            'balance',
        ]);
        expect(JSON.stringify(options.queryKey)).not.toContain('session');
    });

    it('marks balances confidential and refreshes them at the network interval', () => {
        expect(getChainAccountBalanceQueryOptions({ network, ref, enabled: true })).toMatchObject({
            meta: CONFIDENTIAL_QUERY_META,
            staleTime: 60_000,
            refetchInterval: 60_000,
            refetchIntervalInBackground: false,
            retry: 1,
        });
    });

    it('never fetches a disabled balance', () => {
        expect(getChainAccountBalanceQueryOptions({ network, ref, enabled: false }).queryFn).toBe(
            skipToken,
        );
    });

    it('keys a rate by network, backend and currency', () => {
        const options = getNativeFiatRateQueryOptions({ network, currency: 'usd', enabled: true });

        expect(options.queryKey).toEqual(['chain', 'eth', 'blockbook', 'fiat-rate', 'usd']);
        expect(options.meta).toBeUndefined();
    });
});
