import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import {
    SEND_ACCOUNT_BALANCE_TEST_ID,
    SellSendAccountCryptoBalance,
} from '../SellSendAccountCryptoBalance';

describe('SellSendAccountCryptoBalance', () => {
    let sellForm: SellFormType;

    const renderSellForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useSellForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProviderAsync(<SellSendAccountCryptoBalance />, {
            wrapper: ({ children }) => <Form form={sellForm}>{children}</Form>,
        });

    beforeEach(async () => {
        sellForm = await renderSellForm();
    });

    it('should use asset form field as default symbol', async () => {
        act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use sendAccount form field to obtain account', async () => {
        act(() => {
            sellForm.setValue('sendAsset', btcAsset);
        });
        act(() => {
            sellForm.setValue('sendAccount', getBtcAccount());
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(SEND_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
