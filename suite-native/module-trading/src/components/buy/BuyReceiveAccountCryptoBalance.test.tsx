import { deviceInitialState } from '@suite-common/device';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import {
    BuyReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from './BuyReceiveAccountCryptoBalance';
import { useBuyForm } from '../../hooks/buy/useBuyForm';

describe('BuyReceiveAccountCryptoBalance', () => {
    let buyForm: BuyFormType;
    const preloadedState = {
        device: deviceInitialState,
        wallet: getWalletState({ tradeType: 'buy' }),
    };

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProvider(() => useBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderComponent = async () =>
        await renderWithStoreProvider(<BuyReceiveAccountCryptoBalance />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={buyForm}>{children}</Form>,
        });

    beforeEach(async () => {
        buyForm = await renderBuyForm();
    });

    it('should use asset form field as default symbol', async () => {
        await act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use receiveAccount form field to obtain account', async () => {
        await act(() => {
            buyForm.setValue('asset', btcAsset);
        });
        await act(() => {
            buyForm.setValue('receiveAccount', {
                account: getBtcAccount(),
            });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
