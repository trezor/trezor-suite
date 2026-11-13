import type { SendOptions } from '@trezor/network-module-suite-common-types';

/** A UTXO transaction: several recipients, a data output, a locktime and a choice of coins. */
export const bitcoinSendOptions: SendOptions = {
    getOptions: () => ({
        multipleRecipients: true,
        importRecipients: true,
        dataOutput: true,
        locktime: true,
        coinControl: true,
        broadcastToggle: true,
    }),
};
