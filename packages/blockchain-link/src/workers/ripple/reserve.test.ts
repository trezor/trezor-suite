import {
    RIPPLE_BASE_RESERVE_DEFAULT,
    RIPPLE_OWNER_RESERVE_DEFAULT,
} from '@trezor/network-ripple/constants';

import { updateReserveFromLedger } from './reserve';

// Regression tests for the `ledgerClosed` listener DoS: a malformed/malicious
// rippled backend can send a ledgerClosed notification that omits the reserve
// fields; the pre-fix `ledger.reserve_base.toString()` threw synchronously out of
// xrpl's ws 'message' handler and crashed the worker.
describe('updateReserveFromLedger', () => {
    const freshReserve = () => ({
        BASE: RIPPLE_BASE_RESERVE_DEFAULT,
        OWNER: RIPPLE_OWNER_RESERVE_DEFAULT,
    });

    it('updates both reserves from a well-formed ledgerClosed message', () => {
        const reserve = freshReserve();
        updateReserveFromLedger(reserve, { reserve_base: 20000000, reserve_inc: 5000000 } as any);
        expect(reserve).toEqual({ BASE: '20000000', OWNER: '5000000' });
    });

    it('does not throw and keeps defaults when reserve fields are missing', () => {
        const reserve = freshReserve();
        expect(() => updateReserveFromLedger(reserve, {} as any)).not.toThrow();
        expect(reserve).toEqual({
            BASE: RIPPLE_BASE_RESERVE_DEFAULT,
            OWNER: RIPPLE_OWNER_RESERVE_DEFAULT,
        });
    });

    it('does not throw on an undefined ledger', () => {
        const reserve = freshReserve();
        expect(() => updateReserveFromLedger(reserve, undefined)).not.toThrow();
        expect(reserve).toEqual({
            BASE: RIPPLE_BASE_RESERVE_DEFAULT,
            OWNER: RIPPLE_OWNER_RESERVE_DEFAULT,
        });
    });

    it('updates only the field that is present (partial message)', () => {
        const reserve = freshReserve();
        updateReserveFromLedger(reserve, { reserve_base: 15000000 } as any);
        expect(reserve).toEqual({ BASE: '15000000', OWNER: RIPPLE_OWNER_RESERVE_DEFAULT });
    });
});
