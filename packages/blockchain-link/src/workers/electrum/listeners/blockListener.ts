import { throwError } from '@trezor/utils';
import { RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { blockheaderToBlockhash } from '../utils';
import type { BaseWorker } from '../../baseWorker';
import type { BlockHeader, ElectrumAPI } from '@trezor/blockchain-link-types/lib/electrum';

export const blockListener = (worker: BaseWorker<ElectrumAPI>) => {
    const { state } = worker;
    const api = () => worker.api ?? throwError('API not created');

    const onBlock = (blocks: BlockHeader[]) => {
        blocks.forEach(({ height, hex }) =>
            worker.post({
                id: -1,
                type: RESPONSES.NOTIFICATION,
                payload: {
                    type: 'block',
                    payload: {
                        blockHeight: height,
                        blockHash: blockheaderToBlockhash(hex),
                    },
                },
            }),
        );
    };

    const subscribe = () => {
        if (!state.getSubscription('block')) {
            state.addSubscription('block');
            api().on('blockchain.headers.subscribe', onBlock);
        }

        return { subscribed: true };
    };

    const unsubscribe = () => {
        if (state.getSubscription('block')) {
            api().off('blockchain.headers.subscribe', onBlock);
            state.removeSubscription('block');
        }

        return { subscribed: false };
    };

    return {
        subscribe,
        unsubscribe,
    };
};
