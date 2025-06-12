import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import {
    ExchangeReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from '../ExchangeReceiveAccountCryptoBalance';

describe('ExchangeReceiveAccountCryptoBalance', () => {
    let exchangeForm: ExchangeFormType;

    const renderExchangeForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useExchangeForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProviderAsync(<ExchangeReceiveAccountCryptoBalance />, {
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(async () => {
        exchangeForm = await renderExchangeForm();
    });

    it('should use asset form field as default symbol', async () => {
        act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use receiveAccount form field to obtain account', async () => {
        act(() => {
            exchangeForm.setValue('receiveAccount', {
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
