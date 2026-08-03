import {
    RIPPLE_BASE_RESERVE_DEFAULT,
    RIPPLE_OWNER_RESERVE_DEFAULT,
} from '@trezor/network-ripple/constants';
import type { LedgerStream } from '@trezor/network-ripple/types';

// Current ledger reserve values. Mutable and module-scoped: it is written both by the
// `getInfo` handler and by the `ledgerClosed` listener in RippleWorker, and read by
// `getAccountInfo`. Importers share one object, which is the pre-existing behaviour.
export const RESERVE = {
    BASE: RIPPLE_BASE_RESERVE_DEFAULT,
    OWNER: RIPPLE_OWNER_RESERVE_DEFAULT,
};

// Update the reserve cache from an xrpl `ledgerClosed` stream message. A malformed
// or malicious rippled backend (custom XRP backends are user-selectable) may send a
// ledgerClosed notification that omits `reserve_base`/`reserve_inc`; a bare
// `.toString()` on the missing field would throw synchronously out of xrpl's ws
// 'message' handler (Connection.onMessage → emit) and become an uncaughtException
// that crashes the blockchain worker (remote DoS). Guard each field before reading it.
export const updateReserveFromLedger = (
    reserve: { BASE: string; OWNER: string },
    ledger: Pick<LedgerStream, 'reserve_base' | 'reserve_inc'> | undefined,
) => {
    if (ledger?.reserve_base != null) {
        reserve.BASE = ledger.reserve_base.toString();
    }
    if (ledger?.reserve_inc != null) {
        reserve.OWNER = ledger.reserve_inc.toString();
    }
};
