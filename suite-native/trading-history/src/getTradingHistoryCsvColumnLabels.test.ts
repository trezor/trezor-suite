import { TRADING_HISTORY_CSV_COLUMNS } from '@suite-common/trading';
import { type Translate } from '@suite-native/intl';

import { getTradingHistoryCsvColumnLabels } from './getTradingHistoryCsvColumnLabels';

describe('getTradingHistoryCsvColumnLabels', () => {
    // Stub translate that echoes the message id, so we can assert the mapping without a real catalog.
    const translate = ((id: string) => id) as Translate;

    it('maps every CSV column to its translation key', () => {
        const labels = getTradingHistoryCsvColumnLabels(translate);

        expect(Object.keys(labels).sort()).toEqual([...TRADING_HISTORY_CSV_COLUMNS].sort());
        TRADING_HISTORY_CSV_COLUMNS.forEach(column => {
            expect(labels[column]).toBe(`moduleTrading.tradeHistory.export.columns.${column}`);
        });
    });
});
