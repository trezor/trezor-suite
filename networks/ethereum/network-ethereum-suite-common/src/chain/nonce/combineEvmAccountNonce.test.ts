import { combineEvmAccountNonce } from './combineEvmAccountNonce';

describe(combineEvmAccountNonce.name, () => {
    it('takes the backend count when nothing of the wallet is pending', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 5, confirmedNonce: 5 }, [])).toEqual({
            confirmedNonce: 5,
            nextNonce: 5,
            pendingNonces: [],
        });
    });

    it('walks past own pending sends the backend does not see yet', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 5, confirmedNonce: 5 }, [5, 6])).toEqual({
            confirmedNonce: 5,
            nextNonce: 7,
            pendingNonces: [5, 6],
        });
    });

    it('stops at the first gap, so a stuck send does not inflate the next nonce', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 5, confirmedNonce: 5 }, [5, 8])).toEqual({
            confirmedNonce: 5,
            nextNonce: 6,
            pendingNonces: [5, 8],
        });
    });

    it('walks past own sends right after the ones the backend sees', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 6, confirmedNonce: 5 }, [6, 7])).toEqual({
            confirmedNonce: 5,
            nextNonce: 8,
            pendingNonces: [5, 6, 7],
        });
    });

    it('never goes below the backend count, which covers sends from elsewhere', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 9, confirmedNonce: 6 }, [6])).toEqual({
            confirmedNonce: 6,
            nextNonce: 9,
            pendingNonces: [6, 7, 8],
        });
    });

    it('ignores own sends already mined', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 6, confirmedNonce: 6 }, [4, 5])).toEqual({
            confirmedNonce: 6,
            nextNonce: 6,
            pendingNonces: [],
        });
    });

    it('lowers a pending-inclusive count to the lowest own pending send without a mined-only count', () => {
        expect(combineEvmAccountNonce({ pendingNonce: 7 }, [5, 6])).toEqual({
            confirmedNonce: 5,
            nextNonce: 7,
            pendingNonces: [5, 6],
        });
        expect(combineEvmAccountNonce({ pendingNonce: 7 }, [])).toEqual({
            confirmedNonce: 7,
            nextNonce: 7,
            pendingNonces: [],
        });
    });

    it('bounds the pending list against a bogus count', () => {
        const nonce = combineEvmAccountNonce({ pendingNonce: 1_000_000, confirmedNonce: 0 }, []);

        expect(nonce.nextNonce).toBe(1_000_000);
        expect(nonce.pendingNonces).toHaveLength(1024);
    });
});
