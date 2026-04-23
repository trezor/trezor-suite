import { type TradingTransaction } from '@suite-common/trading';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';

import { TradeDetailInfo } from '../TradeDetailInfo';

// The date assertions below encode the en-US format (MM/DD/YYYY). That's
// fragile in two ways:
//   1. `prepareDateFormatter` in @suite-common/formatters intentionally calls
//      `new Intl.DateTimeFormat(undefined, …)` — it ignores the app's configured
//      locale and follows the *device* locale. CI runs on Ubuntu with en_US, so
//      there the test happens to pass; on a cs_CZ or de_DE dev box it fails.
//   2. The assertion therefore tests the CI environment, not any behavior of
//      this component. The cleaner long-term fix is either to loosen the regex
//      or to make `prepareDateFormatter` respect `_config.locale` — that latter
//      is a product decision (dates would start following the in-app language
//      instead of the OS), so it's out of scope for a test fix.
// As a localized workaround, wrap Intl.DateTimeFormat in a Proxy that defaults
// the locale arg to en-US. Proxy (rather than `jest.spyOn(...).mockImplementation`)
// is needed so that static methods like `supportedLocalesOf` keep working —
// react-intl calls them during render.
const OriginalDateTimeFormat = Intl.DateTimeFormat;
beforeAll(() => {
    (Intl as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat = new Proxy(
        OriginalDateTimeFormat,
        {
            construct: (target, args) => new target(args[0] ?? 'en-US', args[1]),
            apply: (target, _thisArg, args) =>
                Reflect.apply(target, undefined, [args[0] ?? 'en-US', args[1]]),
        },
    );
});
afterAll(() => {
    (Intl as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat =
        OriginalDateTimeFormat;
});

const getPreloadedState = (trades: TradingTransaction[]) => ({
    wallet: {
        trading: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

describe('TradeDetailInfo', () => {
    it('should not render when trade is not found', () => {
        const preloadedState = getPreloadedState([]);

        const { toJSON } = renderWithStoreProvider(
            <TradeDetailInfo orderId="nonexistent_order_id" />,
            { preloadedState, providers: ['intl', 'formatter'] },
        );

        expect(toJSON()).toBeNull();
    });

    it('should render buy trade info correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const preloadedState = getPreloadedState([buyTrade]);

        const { getByText } = renderWithStoreProvider(
            <TradeDetailInfo orderId={buyTrade.data.orderId!} />,
            { preloadedState, providers: ['intl', 'formatter'] },
        );

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('Credit Card')).toBeTruthy();

        expect(getByText(/0[45]\/10\/2025/)).toBeTruthy();
        expect(getByText(/[0-9]{1,2}:21/)).toBeTruthy();
    });

    it('should render exchange trade info correctly', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const preloadedState = getPreloadedState([exchangeTrade]);

        const { getByText, queryByText } = renderWithStoreProvider(
            <TradeDetailInfo orderId={exchangeTrade.data.orderId!} />,
            { preloadedState, providers: ['intl', 'formatter'] },
        );

        expect(getByText(/0[23]\/12\/2025/)).toBeTruthy();
        expect(getByText(/[0-9]{1,2}:11/)).toBeTruthy();
        expect(queryByText('Mercuryo')).toBeNull();
    });
});
