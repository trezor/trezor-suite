import type { SendOptions } from '@trezor/network-module-suite-common-types';

/** Several recipients in one transaction, and nothing else beyond an amount and an address. */
export const cardanoSendOptions: SendOptions = {
    recipients: { canImport: false },
};
