import { mapGetAccountInfoResponse } from './accountInfo';

const DESCRIPTOR = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';

const map = (overrides: Partial<Parameters<typeof mapGetAccountInfoResponse>[0]> = {}) =>
    mapGetAccountInfoResponse({
        descriptor: DESCRIPTOR,
        balance: 0n,
        nonce: 0,
        pendingNonce: 0,
        historyTotal: -1,
        ...overrides,
    }).payload;

describe(mapGetAccountInfoResponse.name, () => {
    it('reports an untouched account as empty', () => {
        expect(map().empty).toBe(true);
    });

    it('is not empty with a balance or a nonce', () => {
        expect(map({ balance: 1n }).empty).toBe(false);
        expect(map({ nonce: 1 }).empty).toBe(false);
    });

    it('is not empty when only tokens were ever received', () => {
        const payload = map({
            tokens: [{ standard: 'ERC20', contract: '0xabc', decimals: 6, balance: '10' }],
        });

        expect(payload.empty).toBe(false);
        expect(payload.tokens).toHaveLength(1);
    });

    it('is not empty when transactions are known', () => {
        expect(map({ historyTotal: 3 }).empty).toBe(false);
    });

    it('passes the transaction count through unchanged, including the unknown marker', () => {
        expect(map().history.total).toBe(-1);
        expect(map({ historyTotal: 0 }).history.total).toBe(0);
        expect(map({ historyTotal: 7 }).history.total).toBe(7);
    });

    it('derives unconfirmed from the nonce gap', () => {
        expect(map({ nonce: 4, pendingNonce: 6 }).history.unconfirmed).toBe(2);
    });

    it('collapses an empty token list so it reads as absent', () => {
        expect(map({ tokens: [] }).tokens).toBeUndefined();
    });
});
