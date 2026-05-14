import { events } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
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

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('SellForm', () => {
    const renderFormHook = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderHookWithTradingProvider(() => useSellForm(), {
            tradeType: 'sell',
            overrides,
        });

    const renderSellForm = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
        form: SellFormType,
    ) =>
        renderWithTradingProvider(<SellForm />, {
            tradeType: 'sell',
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render when sell data are not preloaded', () => {
        const { result } = renderFormHook();
        const { getByText, getByLabelText } = renderSellForm({}, result.current);

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('You get')).toBeOnTheScreen();
        expect(getByLabelText('Select asset')).toHaveTextContent(/Select asset/);
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

            expect(getByText('You pay')).toBeOnTheScreen();
            expect(getByLabelText('Select fiat currency')).toBeOnTheScreen();
            expect(getByLabelText('Select asset')).toHaveTextContent(/BTC/);
            expect(getByText('Country of residence')).toBeOnTheScreen();
            expect(getByText('Provider')).toBeOnTheScreen();
        });

        it('should render only SellCard and Done when amount input is active', () => {
            act(() => {
                form.setValue('focusedValue', 'fiatStringAmount');
            });
            const { queryByText, getByText } = renderSellForm(overrides, form);

            expect(getByText('You pay')).toBeOnTheScreen();
            expect(getByText('You get')).toBeOnTheScreen();

            expect(queryByText('Continue')).toBeNull();
            expect(queryByText('Country of residence')).toBeNull();
            expect(queryByText('Provider')).toBeNull();
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
