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
    ExchangeSendAccountCryptoBalance,
    SEND_ACCOUNT_BALANCE_TEST_ID,
} from '../ExchangeSendAccountCryptoBalance';

describe('ExchangeSendAccountCryptoBalance', () => {
    let exchangeForm: ExchangeFormType;

    const renderExchangeForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useExchangeForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProviderAsync(<ExchangeSendAccountCryptoBalance />, {
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(async () => {
        exchangeForm = await renderExchangeForm();
    });

    it('should use asset form field as default symbol', async () => {
        act(() => {
            exchangeForm.setValue('sendAsset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use sendAccount form field to obtain account', async () => {
        act(() => {
            exchangeForm.setValue('sendAccount', {
                symbol: 'btc',
                balance: '1000000',
            } as any);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
