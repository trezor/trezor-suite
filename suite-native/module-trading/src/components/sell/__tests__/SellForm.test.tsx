import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, screen } from '@suite-native/test-utils-store';
import {
    banxaBankTransferSellQuote,
    btcAsset,
    getBtcAccount,
    residenceCheckDisabledState,
    sellQuotes,
} from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellForm } from '../SellForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

jest.mock('../../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('SellForm', () => {
    const renderFormHook = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderHookWithTradingProvider(() => useSellForm(), {
            services,
            tradeType: 'sell',
            overrides,
        });

    const renderSellForm = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
        form: SellFormType,
    ) =>
        renderWithTradingProvider(<SellForm />, {
            services,
            tradeType: 'sell',
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render when sell data are not preloaded', () => {
        const { result } = renderFormHook();
        const { getByText, getByLabelText } = renderSellForm({}, result.current);

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
    });

    describe('with preloaded sell data', () => {
        let form: SellFormType;
        let overrides: PreloadedStatePartial<TradingTestPreloadedState>;

        beforeEach(() => {
            overrides = {
                wallet: { trading: { sell: { quotes: sellQuotes } } },
                ...residenceCheckDisabledState,
            };

            const { result } = renderFormHook(overrides);
            form = result.current;
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('sendAccount', getBtcAccount());
                form.setValue('amountInCrypto', true);
                form.setValue('cryptoStringAmount', '0.001');
                form.setValue('quote', banxaBankTransferSellQuote);
            });
        });

        it('should render with default values', () => {
            const { getByLabelText, getByText } = renderSellForm(overrides, form);

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
            ).toBeOnTheScreen();
            expect(
                getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
            ).toBeOnTheScreen();
            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent(/BTC/);
            expect(
                getByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
            ).toBeOnTheScreen();
            expect(
                getByText(getTranslation('moduleTrading.tradingScreen.provider')),
            ).toBeOnTheScreen();
        });

        it('should render only SellCard and Done when amount input is active', () => {
            act(() => {
                form.setValue('focusedValue', 'fiatStringAmount');
            });
            const { queryByText, getByText } = renderSellForm(overrides, form);

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
            ).toBeOnTheScreen();
            expect(
                getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            ).toBeOnTheScreen();

            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
            ).toBeNull();
            expect(
                queryByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
            ).toBeNull();
            expect(queryByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeNull();
        });
    });

    it('should report to analytics on mount', () => {
        const { result } = renderFormHook();
        renderSellForm({}, result.current);

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingSellEvent.name,
            payload: expect.objectContaining({
                step: 'sell-form',
                action: 'visit',
            }),
        });
    });
});
