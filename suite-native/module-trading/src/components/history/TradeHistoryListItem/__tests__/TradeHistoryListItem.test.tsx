import { type TradingTransaction } from '@suite-common/trading';
import { getBuyTrade, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { TradeHistoryListItem } from '../TradeHistoryListItem';

// The date assertions below encode the en-US format (MM/DD/YYYY at HH:MM).
// That's fragile in two ways:
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

describe('TradeHistoryListItem', () => {
    const renderTradeHistoryListItem = (transaction: TradingTransaction) =>
        renderWithTradingProvider(
            <TradeHistoryListItem transaction={transaction} onPress={jest.fn()} />,
            { overrides: { wallet: { trading: getInitializedTradingState() } } },
        );

    it('should render trade correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = renderTradeHistoryListItem(buyTrade);

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(getByText('Trans. ID: d3ef3451-8f68-4250-9e08-580ece5e7d12')).toBeTruthy();
        expect(getByText('Submitted')).toBeTruthy();
    });

    it('should render date and time', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = renderTradeHistoryListItem(buyTrade);

        expect(getByText(/0[45]\/10\/2025 at [0-9]{1,2}:21/)).toBeTruthy();
    });
});
