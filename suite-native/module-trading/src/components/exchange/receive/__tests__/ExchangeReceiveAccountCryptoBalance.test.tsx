import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
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
            exchangeForm.setValue('receiveAsset', btcAsset);
        });
        act(() => {
            exchangeForm.setValue('receiveAccount', { account: getBtcAccount() });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
