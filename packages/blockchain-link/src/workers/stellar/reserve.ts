import { STELLAR_BASE_RESERVE } from '@trezor/network-stellar/constants';
import { BigNumber } from '@trezor/utils';

// Current base reserve, in stroops. Mutable and module-scoped: it is written by the
// `getInfo` handler from the latest ledger and read by `getAccountInfo`. Importers share
// one object, which is the pre-existing behaviour.
export const RESERVE = {
    BASE: new BigNumber(STELLAR_BASE_RESERVE),
};
