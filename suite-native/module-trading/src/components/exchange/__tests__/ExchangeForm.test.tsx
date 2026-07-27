import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import {
    btcAsset,
    getInitializedTradingState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeForm } from '../ExchangeForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('ExchangeForm', () => {
    let form: ExchangeFormType;
    const defaultPreloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags(),
        },
    });

    const renderForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState: defaultPreloadedState,
        });

    const renderExchangeForm = () =>
        renderWithStoreProvider(<ExchangeForm />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState: {
                ...defaultPreloadedState,
                wallet: {
                    ...defaultPreloadedState.wallet,
                    trading: getInitializedTradingState(),
                },
            },
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render form', () => {
        const { getByText, queryByText } = renderExchangeForm();

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('generic.buttons.done'))).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        ).toBeNull();
    });

    describe('with receive asset selected', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('receiveAsset', btcAsset);
            });
        });

        it('should display Receive account picker', () => {
            const { getByText, queryByText } = renderExchangeForm();

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            ).toBeOnTheScreen();
            expect(queryByText(getTranslation('generic.buttons.done'))).toBeNull();
            expect(
                getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
            ).toBeOnTheScreen();
        });

        it('should display Done button when any input is active', () => {
            act(() => {
                form.setValue('focusedValue', 'sendCryptoAmount');
            });
            const { getByText, queryByText } = renderExchangeForm();

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            ).toBeOnTheScreen();
            expect(getByText(getTranslation('generic.buttons.done'))).toBeOnTheScreen();
            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
            ).toBeNull();
        });

        describe('with quote selected', () => {
            beforeEach(() => {
                act(() => {
                    form.setValue('quote', mercuryoFixedWorstQuote);
                });
            });

            it('should display provider', () => {
                const { getByText } = renderExchangeForm();

                expect(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                ).toBeOnTheScreen();
            });
        });
    });
});
