import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import {
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
    ReceiveAccountCryptoBalance,
} from '../BuyReceiveAccountCryptoBalance';

describe('ReceiveAccountBalance', () => {
    let buyForm: TradingBuyForm;

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return result.current;
    };

    const renderComponent = async () =>
        await renderWithStoreProviderAsync(
            <Form form={buyForm}>
                <ReceiveAccountCryptoBalance />
            </Form>,
        );

    beforeEach(async () => {
        buyForm = await renderBuyForm();
    });

    it('should display empty box when symbol is not specified', async () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: undefined,
                    balance: '10000',
                } as any,
            });
        });
        const { queryByTestId } = await renderComponent();

        expect(queryByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
    });

    it('should display empty box when balance is not specified', async () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: 'btc',
                    balance: undefined,
                } as any,
            });
        });
        const { queryByTestId } = await renderComponent();

        expect(queryByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toBeNull();
    });

    it('should display balance when symbol and balance is specified', async () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: 'btc',
                    balance: '1000000',
                } as any,
            });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
