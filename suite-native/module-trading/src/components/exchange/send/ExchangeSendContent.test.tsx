import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeSendContent } from './ExchangeSendContent';
import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';

describe('ExchangeSendContent', () => {
    let form: ExchangeFormType;
    const preloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags(),
        },
    });

    const renderForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
        });

    const renderExchangeSendContent = () =>
        renderWithStoreProvider(<ExchangeSendContent />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState,
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render all components', () => {
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendCryptoAmount', '100');
        });
        const { getByText, getByLabelText } = renderExchangeSendContent();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(/USDC/);
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toHaveDisplayValue('100');
        expect(getByText(getTranslation('moduleTrading.tradingScreen.balance'))).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
