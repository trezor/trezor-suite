import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailPlacedAtRow } from './TradingHistoryDetailPlacedAtRow';

describe('TradingHistoryDetailPlacedAtRow', () => {
    it('renders the placement date', async () => {
        const { getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailPlacedAtRow placedAt={new Date('2025-01-15T10:00:00Z')} />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.placed')),
        ).toBeOnTheScreen();
        expect(getByText(/2025/)).toBeOnTheScreen();
    });
});
