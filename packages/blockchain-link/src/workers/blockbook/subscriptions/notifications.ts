import type {
    BlockbookAddressNotification as AddressNotification,
    BlockbookBlockNotification as BlockNotification,
    BlockbookFiatRatesNotification as FiatRatesNotification,
    BlockbookMempoolTransactionNotification as MempoolTransactionNotification,
} from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockbook';

import type { Context } from '../types';

export const onNewBlock = ({ post }: Context, event: BlockNotification) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height,
                blockHash: event.hash,
                evmData: event.evmData ?? null,
            },
        },
    });
};

export const onMempoolTx = ({ post }: Context, payload: MempoolTransactionNotification) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'mempool',
            payload,
        },
    });
};

export const onTransaction = ({ state, post }: Context, event: AddressNotification) => {
    if (!event.tx) return;
    const descriptor = event.address;
    // check if there is subscribed account with received address
    const account = state.getAccount(descriptor);
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? transformTransaction(event.tx, account.addresses ?? account.descriptor)
                    : transformTransaction(event.tx, descriptor),
            },
        },
    });
};

export const onNewFiatRates = ({ post }: Context, event: FiatRatesNotification) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'fiatRates',
            payload: {
                rates: event.rates,
            },
        },
    });
};
