import { throwError } from '@trezor/utils';
import { RESPONSES } from '@trezor/blockchain-link-types/lib/constants';
import { createAddressManager, getTransactions } from '../utils';
import { transformTransaction } from '../../../../../blockchain-link-utils/lib/blockbook';
import type { BaseWorker } from '../../baseWorker';
import type {
    ElectrumAPI,
    HistoryTx,
    StatusChange,
} from '@trezor/blockchain-link-types/lib/electrum';
import type { Subscribe, Unsubscribe } from '@trezor/blockchain-link-types/lib/messages';

type Payload<T extends { type: string; payload: any }> = Extract<
    T['payload'],
    { type: 'addresses' | 'accounts' }
>;

// TODO optimize if neccessary
const mostRecent = (previous: HistoryTx | undefined, current: HistoryTx) => {
    if (previous === undefined) return current;
    if (previous.height === -1) return previous;
    if (current.height === -1) return current;
    if (previous.height === 0) return previous;
    if (current.height === 0) return current;
    return previous.height >= current.height ? previous : current;
};

export const txListener = (worker: BaseWorker<ElectrumAPI>) => {
    const { state } = worker;
    const api = () => worker.api ?? throwError('API not created');

    const addressManager = createAddressManager(() => api().getInfo()?.network);

    const onTransaction = async ([scripthash, _status]: StatusChange) => {
        const { descriptor, addresses } = addressManager.getInfo(scripthash);
        if (descriptor === scripthash) {
            // scripthash was subscribed to only internally, not explicitly from Suite
            return;
        }
        const history = await api().request('blockchain.scripthash.get_history', scripthash);
        const recent = history.reduce<HistoryTx | undefined>(mostRecent, undefined);
        if (!recent) return;
        const [tx] = await getTransactions(api(), [recent]);
        worker.post({
            id: -1,
            type: RESPONSES.NOTIFICATION,
            payload: {
                type: 'notification',
                payload: {
                    descriptor,
                    tx: transformTransaction(tx, addresses ?? descriptor),
                },
            },
        });
    };

    const subscribe = async (data: Payload<Subscribe>) => {
        const shToSubscribe =
            data.type === 'accounts'
                ? addressManager.addAccounts(data.accounts)
                : addressManager.addAddresses(data.addresses);

        if (!shToSubscribe.length) return { subscribed: false };

        if (!state.getSubscription('notification')) {
            api().on('blockchain.scripthash.subscribe', onTransaction);
            state.addSubscription('notification');
        }

        await Promise.all(
            shToSubscribe.map(scripthash =>
                api().request('blockchain.scripthash.subscribe', scripthash),
            ),
        );
        return { subscribed: true };
    };

    const unsubscribe = async (data: Payload<Unsubscribe>) => {
        const shToUnsubscribe =
            data.type === 'accounts'
                ? addressManager.removeAccounts(data.accounts)
                : addressManager.removeAddresses(data.addresses);

        if (!shToUnsubscribe.length) return { subscribed: false };

        if (state.getSubscription('notification') && !addressManager.getCount()) {
            api().off('blockchain.scripthash.subscribe', onTransaction);
            state.removeSubscription('notification');
        }

        await Promise.all(
            shToUnsubscribe.map(scripthash =>
                api().request('blockchain.scripthash.unsubscribe', scripthash),
            ),
        );
        return { subscribed: false };
    };

    return {
        subscribe,
        unsubscribe,
    };
};
