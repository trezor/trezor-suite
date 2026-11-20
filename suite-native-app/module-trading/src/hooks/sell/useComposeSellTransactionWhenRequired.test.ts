import type { SellTradeStatus } from 'invity-api';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useComposeSellTransactionWhenRequired } from './useComposeSellTransactionWhenRequired';

type TestProps = {
    orderId: string | undefined;
    status: SellTradeStatus | undefined;
};

describe('useComposeSellTransactionWhenRequired', () => {
    it('composes once for each order that reaches SEND_CRYPTO', async () => {
        const composeTradingTransaction = jest.fn();
        const initialProps: TestProps = {
            orderId: 'order-1',
            status: 'PENDING',
        };
        const { rerender } = await renderHookWithBasicProvider(
            ({ orderId, status }: TestProps) =>
                useComposeSellTransactionWhenRequired({
                    orderId,
                    status,
                    composeTradingTransaction,
                }),
            { initialProps },
        );

        expect(composeTradingTransaction).not.toHaveBeenCalled();

        await rerender({ orderId: 'order-1', status: 'SEND_CRYPTO' });
        await rerender({ orderId: 'order-1', status: 'SEND_CRYPTO' });

        expect(composeTradingTransaction).toHaveBeenCalledTimes(1);

        await rerender({ orderId: 'order-2', status: 'SEND_CRYPTO' });

        expect(composeTradingTransaction).toHaveBeenCalledTimes(2);
    });
});
