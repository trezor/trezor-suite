import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import {
    BuyReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from '../BuyReceiveAccountCryptoBalance';

describe('BuyReceiveAccountCryptoBalance', () => {
    let buyForm: BuyFormType;

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm());

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProviderAsync(<BuyReceiveAccountCryptoBalance />, {
            wrapper: ({ children }) => <Form form={buyForm}>{children}</Form>,
        });

    beforeEach(async () => {
        buyForm = await renderBuyForm();
    });

    it('should use asset form field as default symbol', async () => {
        act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use receiveAccount form field to obtain account', async () => {
        act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: getBtcAccount(),
            });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
