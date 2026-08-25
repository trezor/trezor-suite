import type { SellTradeStatus } from 'invity-api';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useComposeSellTransactionWhenRequired } from './useComposeSellTransactionWhenRequired';

type TestProps = {
    orderId: string | undefined;
    status: SellTradeStatus | undefined;
};

describe('useComposeSellTransactionWhenRequired', () => {
    it('composes once for each order that reaches SEND_CRYPTO', () => {
        const composeTradingTransaction = jest.fn();
        const initialProps: TestProps = {
            orderId: 'order-1',
            status: 'PENDING',
        };
        const { rerender } = renderHookWithBasicProvider(
            ({ orderId, status }: TestProps) =>
                useComposeSellTransactionWhenRequired({
                    orderId,
                    status,
                    composeTradingTransaction,
                }),
            { initialProps },
        );

        expect(composeTradingTransaction).not.toHaveBeenCalled();

        rerender({ orderId: 'order-1', status: 'SEND_CRYPTO' });
        rerender({ orderId: 'order-1', status: 'SEND_CRYPTO' });

        expect(composeTradingTransaction).toHaveBeenCalledTimes(1);

        rerender({ orderId: 'order-2', status: 'SEND_CRYPTO' });

        expect(composeTradingTransaction).toHaveBeenCalledTimes(2);
    });
});
