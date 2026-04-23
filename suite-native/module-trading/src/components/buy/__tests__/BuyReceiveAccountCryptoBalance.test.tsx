import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import {
    BuyReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from '../BuyReceiveAccountCryptoBalance';

describe('BuyReceiveAccountCryptoBalance', () => {
    let buyForm: BuyFormType;
    const preloadedState = { wallet: getWalletState({ tradeType: 'buy' }) };

    const renderBuyForm = () => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
            providers: ['intl', 'formatter', 'navigation'],
        });

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProvider(<BuyReceiveAccountCryptoBalance />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={buyForm}>{children}</Form>,
            providers: ['intl', 'formatter', 'navigation'],
        });

    beforeEach(() => {
        buyForm = renderBuyForm();
    });

    it('should use asset form field as default symbol', () => {
        act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use receiveAccount form field to obtain account', () => {
        act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        act(() => {
            buyForm.setValue('receiveAccount', {
                account: getBtcAccount(),
            });
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
