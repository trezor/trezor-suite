import { deviceInitialState } from '@suite-common/device';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    ExchangeReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from './ExchangeReceiveAccountCryptoBalance';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';

describe('ExchangeReceiveAccountCryptoBalance', () => {
    let exchangeForm: ExchangeFormType;
    const preloadedState = {
        device: deviceInitialState,
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
        wallet: getWalletState({ tradeType: 'exchange' }),
    };

    const renderExchangeForm = async () => {
        const { result } = await renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderComponent = async () =>
        await renderWithStoreProvider(<ExchangeReceiveAccountCryptoBalance />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(async () => {
        exchangeForm = await renderExchangeForm();
    });

    it('should use asset form field as default symbol', async () => {
        await act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use receiveAccount form field to obtain account', async () => {
        await act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });
        await act(() => {
            exchangeForm.setValue('receiveAccount', { account: getBtcAccount() });
        });
        const { getByTestId } = await renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
