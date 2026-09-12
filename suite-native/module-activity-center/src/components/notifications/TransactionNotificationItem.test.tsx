import type { ComponentProps } from 'react';

import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TransactionNotificationItem } from './TransactionNotificationItem';

type TransactionNotificationItemProps = ComponentProps<typeof TransactionNotificationItem>;

describe('TransactionNotificationItem', () => {
    it('renders tx-exchange notification without crashing', async () => {
        const exchangeNotification = {
            id: 1234567890,
            context: 'toast',
            type: 'tx-exchange',
            descriptor: '0x1234567890abcdef',
            symbol: 'btc',
            txid: '0xtxid123',
            formattedAmount: '0.1 BTC',
            metadata: {},
        } as unknown as TransactionNotificationItemProps['notification'];

        const { getByText } = await renderWithStoreProvider(
            <TransactionNotificationItem
                notification={exchangeNotification}
                seen={false}
                index={0}
            />,
            {
                preloadedState: {
                    device: {
                        selectedDevice: undefined,
                        devices: [],
                    } as any,
                },
            },
        );

        expect(getByText(/Traded in/i)).toBeTruthy();
    });
});
