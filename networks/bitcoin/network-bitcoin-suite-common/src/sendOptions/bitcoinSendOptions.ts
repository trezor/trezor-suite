import type { SendOptions } from '@trezor/network-module-suite-common-types';

/** A UTXO transaction: several recipients, a data output, a locktime and a choice of coins. */
export const bitcoinSendOptions: SendOptions = {
    recipients: { canImport: true },
    dataOutput: true,
    locktime: true,
    coinSelection: true,
    deferredBroadcast: true,
};
