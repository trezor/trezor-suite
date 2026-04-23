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
import { ExchangeSendCard } from '../ExchangeSendCard';

describe('ExchangeSendCard', () => {
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
            providers: ['intl', 'formatter', 'navigation'],
        });

    const renderExchangeSendCard = (isAmountInputActive: boolean) =>
        renderWithStoreProvider(<ExchangeSendCard isAmountInputActive={isAmountInputActive} />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState,
            providers: ['intl', 'formatter', 'navigation'],
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
        const { getByText, getByLabelText } = renderExchangeSendCard(false);

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('$99.00')).toBeOnTheScreen();
        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You pay')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
