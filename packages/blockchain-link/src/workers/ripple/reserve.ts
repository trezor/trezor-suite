import {
    RIPPLE_BASE_RESERVE_DEFAULT,
    RIPPLE_OWNER_RESERVE_DEFAULT,
} from '@trezor/network-ripple/constants';

// Current ledger reserve values. Mutable and module-scoped: it is written both by the
// `getInfo` handler and by the `ledgerClosed` listener in RippleWorker, and read by
// `getAccountInfo`. Importers share one object, which is the pre-existing behaviour.
export const RESERVE = {
    BASE: RIPPLE_BASE_RESERVE_DEFAULT,
    OWNER: RIPPLE_OWNER_RESERVE_DEFAULT,
};
