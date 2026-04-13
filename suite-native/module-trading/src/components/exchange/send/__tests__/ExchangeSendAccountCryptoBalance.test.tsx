import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import {
    ExchangeSendAccountCryptoBalance,
    SEND_ACCOUNT_BALANCE_TEST_ID,
} from '../ExchangeSendAccountCryptoBalance';

describe('ExchangeSendAccountCryptoBalance', () => {
    let exchangeForm: ExchangeFormType;

    const renderExchangeForm = () => {
        const { result } = renderHookWithStoreProvider(() => useExchangeForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProvider(<ExchangeSendAccountCryptoBalance />, {
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(() => {
        exchangeForm = renderExchangeForm();
    });

    it('should use asset form field as default symbol', () => {
        act(() => {
            exchangeForm.setValue('sendAsset', btcAsset);
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use sendAccount form field to obtain account', () => {
        act(() => {
            exchangeForm.setValue('sendAsset', btcAsset);
        });
        act(() => {
            exchangeForm.setValue('sendAccount', getBtcAccount());
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
