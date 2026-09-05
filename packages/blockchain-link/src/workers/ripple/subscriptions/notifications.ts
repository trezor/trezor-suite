import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/ripple';
import type { LedgerStream, TransactionStream } from '@trezor/network-ripple/types';

import type { Context } from '../types';

export const onNewBlock = ({ post }: Context, event: LedgerStream) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.ledger_index,
                blockHash: event.ledger_hash,
            },
        },
    });
};

export const onTransaction = ({ state, post }: Context, event: TransactionStream) => {
    if (event.type !== 'transaction') return;
    // ignore transactions other than Payment
    if (event.tx_json?.TransactionType !== 'Payment') return;

    const { tx_json, hash, meta } = event;

    const notify = (descriptor: string) => {
        if (!tx_json || !hash) return;

        post({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    descriptor,
                    tx: transformTransaction(hash, tx_json, meta, descriptor),
                },
            },
        });
    };

    const subscribed = state.getAddresses();
    const sent = subscribed.find(a => a === tx_json.Account);
    if (sent) notify(sent);

    const recv = subscribed.find(a => a === tx_json.Destination);
    if (recv) notify(recv);
};
