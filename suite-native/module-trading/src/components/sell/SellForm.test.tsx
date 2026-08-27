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

import { SellForm } from './SellForm';
import { useSellForm } from '../../hooks/sell/useSellForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));

jest.mock('../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../hooks/general/useFocusedValueWatch'),
);

jest.mock('../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('SellForm', () => {
    const renderFormHook = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderHookWithTradingProvider(() => useSellForm(), {
            services,
            tradeType: 'sell',
            overrides,
        });

    const renderSellForm = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
        form: SellFormType,
    ) =>
        await renderWithTradingProvider(<SellForm />, {
            services,
            tradeType: 'sell',
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render when sell data are not preloaded', async () => {
        const { result } = await renderFormHook();
        const { getByText, getByLabelText } = await renderSellForm({}, result.current);

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

        beforeEach(async () => {
            overrides = {
                wallet: { trading: { sell: { quotes: sellQuotes } } },
                ...residenceCheckDisabledState,
            };

            const { result } = await renderFormHook(overrides);
            form = result.current;
            await act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('sendAccount', getBtcAccount());
                form.setValue('amountInCrypto', true);
                form.setValue('cryptoStringAmount', '0.001');
                form.setValue('quote', banxaBankTransferSellQuote);
            });
        });

        it('should render with default values', async () => {
            const { getByLabelText, getByText } = await renderSellForm(overrides, form);

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

        it('should render only SellCard and Done when amount input is active', async () => {
            await act(() => {
                form.setValue('focusedValue', 'fiatStringAmount');
            });
            const { queryByText, getByText } = await renderSellForm(overrides, form);

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

    it('should report to analytics on mount', async () => {
        const { result } = await renderFormHook();
        await renderSellForm({}, result.current);

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingSellEvent.name,
            payload: expect.objectContaining({
                step: 'sell-form',
                action: 'visit',
            }),
        });
    });
});
