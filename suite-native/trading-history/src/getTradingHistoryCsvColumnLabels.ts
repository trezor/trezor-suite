import {
    TRADING_HISTORY_CSV_COLUMNS,
    type TradingHistoryCsvColumnLabels,
} from '@suite-common/trading';
import { type Translate } from '@suite-native/intl';

/**
 * Build the translated CSV column labels the shared `prepareTradingHistoryCsv` expects, from the
 * mobile app's translation catalog. Iterating `TRADING_HISTORY_CSV_COLUMNS` guarantees every column
 * is covered (a missing message key would be a type error).
 */
export const getTradingHistoryCsvColumnLabels = (
    translate: Translate,
): TradingHistoryCsvColumnLabels =>
    TRADING_HISTORY_CSV_COLUMNS.reduce<TradingHistoryCsvColumnLabels>(
        (labels, column) => ({
            ...labels,
            [column]: translate(`moduleTrading.tradeHistory.export.columns.${column}`),
        }),
        {} as TradingHistoryCsvColumnLabels,
    );
