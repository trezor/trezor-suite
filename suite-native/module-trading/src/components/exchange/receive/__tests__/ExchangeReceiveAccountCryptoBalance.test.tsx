import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import {
    ExchangeReceiveAccountCryptoBalance,
    RECEIVE_ACCOUNT_BALANCE_TEST_ID,
} from '../ExchangeReceiveAccountCryptoBalance';

describe('ExchangeReceiveAccountCryptoBalance', () => {
    let exchangeForm: ExchangeFormType;
    const preloadedState = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
        wallet: getWalletState({ tradeType: 'exchange' }),
    };

    const renderExchangeForm = () => {
        const { result } = renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderComponent = () =>
        renderWithStoreProvider(<ExchangeReceiveAccountCryptoBalance />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    beforeEach(() => {
        exchangeForm = renderExchangeForm();
    });

    it('should use asset form field as default symbol', () => {
        act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:- BTC');
    });

    it('should use receiveAccount form field to obtain account', () => {
        act(() => {
            exchangeForm.setValue('receiveAsset', btcAsset);
        });
        act(() => {
            exchangeForm.setValue('receiveAccount', { account: getBtcAccount() });
        });
        const { getByTestId } = renderComponent();

        expect(getByTestId(RECEIVE_ACCOUNT_BALANCE_TEST_ID)).toHaveTextContent('Balance:0.01 BTC');
    });
});
