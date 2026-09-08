import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailPlacedAtRow } from './TradingHistoryDetailPlacedAtRow';

describe('TradingHistoryDetailPlacedAtRow', () => {
    it('renders the placement date', async () => {
        const { getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailPlacedAtRow placedAt={new Date(2026, 2, 13, 12, 15)} />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.placed')),
        ).toBeOnTheScreen();
        expect(getByText('March 13, 2026 at 12:15')).toBeOnTheScreen();
    });
});
