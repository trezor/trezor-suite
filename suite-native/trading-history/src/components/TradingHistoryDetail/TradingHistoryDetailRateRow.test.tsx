import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailRateRow } from './TradingHistoryDetailRateRow';

describe('TradingHistoryDetailRateRow', () => {
    it.each(['fixed', 'floating'] as const)('renders the %s rate', async rateType => {
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailRateRow rateType={rateType} />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.rate')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation(`moduleTrading.tradeHistory.detail.info.${rateType}`)),
        ).toBeOnTheScreen();
        expect(getByTestId('@trading/history/detail/info/rate/button')).toBeOnTheScreen();
    });
});
