import { selectTransactionBroadcastNotificationByTxid } from './notificationsSelectors';
import { type NotificationsRootState } from './types';

const getState = (): NotificationsRootState => ({
    notifications: [
        {
            context: 'toast',
            id: 3,
            type: 'tx-staked',
            formattedAmount: '1 ETH',
            descriptor: 'descriptor',
            symbol: 'eth',
            txid: 'stake-txid',
        },
        {
            context: 'toast',
            id: 2,
            type: 'tx-confirmed',
            formattedAmount: '1 ETH',
            descriptor: 'descriptor',
            symbol: 'eth',
            txid: 'confirmed-txid',
        },
        {
            context: 'event',
            id: 1,
            type: 'tx-received',
            formattedAmount: '1 ETH',
            descriptor: 'descriptor',
            symbol: 'eth',
            txid: 'received-txid',
        },
    ],
});

describe(selectTransactionBroadcastNotificationByTxid.name, () => {
    it('returns the originating broadcast notification', () => {
        expect(
            selectTransactionBroadcastNotificationByTxid(getState(), 'stake-txid'),
        ).toMatchObject({
            type: 'tx-staked',
            txid: 'stake-txid',
        });
    });

    it('does not treat received or confirmed notifications as broadcasts', () => {
        expect(
            selectTransactionBroadcastNotificationByTxid(getState(), 'received-txid'),
        ).toBeUndefined();
        expect(
            selectTransactionBroadcastNotificationByTxid(getState(), 'confirmed-txid'),
        ).toBeUndefined();
    });
});
