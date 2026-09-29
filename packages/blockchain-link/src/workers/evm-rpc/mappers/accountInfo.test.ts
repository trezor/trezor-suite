import type { TokenInfo } from '@trezor/blockchain-link-types';

import { mapGetAccountInfoResponse } from './accountInfo';

const DESCRIPTOR = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';

const token: TokenInfo = {
    standard: 'ERC20',
    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    balance: '500',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
};

const map = (params: Partial<Parameters<typeof mapGetAccountInfoResponse>[0]>) =>
    mapGetAccountInfoResponse({
        descriptor: DESCRIPTOR,
        balance: 0n,
        nonce: 0,
        pendingNonce: 0,
        ...params,
    }).payload;

describe(mapGetAccountInfoResponse.name, () => {
    it('is empty without balance, nonce or tokens', () => {
        expect(map({})).toMatchObject({ empty: true, tokens: undefined });
    });

    it('is not empty with a balance', () => {
        expect(map({ balance: 1n }).empty).toBe(false);
    });

    it('is not empty with a nonce', () => {
        expect(map({ nonce: 1 }).empty).toBe(false);
    });

    it('is not empty when it holds a token', () => {
        expect(map({ tokens: [token] })).toMatchObject({ empty: false, tokens: [token] });
    });

    it('counts pending transactions from the nonce gap', () => {
        expect(map({ nonce: 3, pendingNonce: 5 }).history).toEqual({ total: -1, unconfirmed: 2 });
    });
});
