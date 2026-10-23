import type {
    BlockfrostBlockContent as BlockContent,
    BlockfrostTransaction,
} from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockfrost';

import type { Context } from '../types';

export const onNewBlock = ({ post }: Context, event: BlockContent) => {
    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height || 0,
                blockHash: event.hash,
            },
        },
    });
};

export const onTransaction = ({ state, post }: Context, event: BlockfrostTransaction) => {
    const descriptor = event.address;
    const account = state.getAccount(descriptor);

    post({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? transformTransaction(event, account.addresses ?? account.descriptor)
                    : transformTransaction(event, descriptor),
            },
        },
    });
};
