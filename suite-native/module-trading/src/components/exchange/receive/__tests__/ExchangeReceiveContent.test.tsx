import { FeatureFlag } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { mercuryoFixedWorstQuote, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeReceiveContent } from '../ExchangeReceiveContent';

describe('ExchangeReceiveContent', () => {
    let form: ExchangeFormType;
    const preloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags({
                [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
            }),
            wallet: {
                trading: {
                    exchange: {
                        exchangeInfo: {
                            buyCryptoIds: [],
                        },
                    },
                },
            },
        },
    });

    const renderForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
        });

    const renderExchangeReceiveContent = () =>
        renderWithStoreProvider(<ExchangeReceiveContent />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render all components', () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', mercuryoFixedWorstQuote);
        });
        const { getByText, getByLabelText } = renderExchangeReceiveContent();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(/USDC/);
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toHaveDisplayValue('0.00083554');
        expect(getByText(getTranslation('moduleTrading.tradingScreen.balance'))).toBeOnTheScreen();
        expect(getByText('- ' + usdcAsset.symbol)).toBeOnTheScreen();
    });
});
