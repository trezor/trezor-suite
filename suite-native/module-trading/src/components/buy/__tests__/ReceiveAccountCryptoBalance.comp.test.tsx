import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import {
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
    ReceiveAccountCryptoBalance,
} from '../ReceiveAccountCryptoBalance';

describe('ReceiveAccountBalance', () => {
    let buyForm: TradingBuyForm;

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithBasicProvider(
            <Form form={buyForm}>
                <ReceiveAccountCryptoBalance />
            </Form>,
        );

    beforeEach(async () => {
        buyForm = await renderBuyForm();
    });

    it('should display empty box when symbol is not specified', () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: undefined,
                    balance: '10000',
                } as any,
            });
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('');
    });

    it('should display empty box when balance is not specified', () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: 'btc',
                    balance: undefined,
                } as any,
            });
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('');
    });

    it('should display balance when symbol and balance is specified', () => {
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: {
                    symbol: 'btc',
                    balance: '1000000',
                } as any,
            });
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('0.01 BTC');
    });
});
