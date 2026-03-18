import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import {
    SEND_ACCOUNT_BALANCE_TEST_ID,
    SellSendAccountCryptoBalance,
} from '../SellSendAccountCryptoBalance';

describe('SellSendAccountCryptoBalance', () => {
    let sellForm: SellFormType;

    const renderSellForm = () => {
        const { result } = renderHookWithStoreProvider(() => useSellForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProvider(<SellSendAccountCryptoBalance />, {
            wrapper: ({ children }) => <Form form={sellForm}>{children}</Form>,
        });

    beforeEach(() => {
        sellForm = renderSellForm();
    });

    it('should use asset form field as default symbol', () => {
        act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use sendAccount form field to obtain account', () => {
        act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        act(() => {
            sellForm.setValue('sendAccount', getBtcAccount());
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
