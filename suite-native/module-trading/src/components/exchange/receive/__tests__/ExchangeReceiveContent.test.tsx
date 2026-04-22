import { FeatureFlag } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
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

        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You get')).toHaveDisplayValue('0.00083554');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
