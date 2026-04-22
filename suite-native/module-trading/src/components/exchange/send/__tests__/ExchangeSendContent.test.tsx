import { FeatureFlag } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeSendContent } from '../ExchangeSendContent';

describe('ExchangeSendContent', () => {
    let form: ExchangeFormType;
    const preloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags({
                [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
            }),
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

        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You pay')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
