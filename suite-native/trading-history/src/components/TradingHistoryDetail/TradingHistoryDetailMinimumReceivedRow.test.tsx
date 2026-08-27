import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailMinimumReceivedRow } from './TradingHistoryDetailMinimumReceivedRow';

describe('TradingHistoryDetailMinimumReceivedRow', () => {
    it('renders the minimum received amount', async () => {
        const { getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailMinimumReceivedRow formattedMinimumReceived="0.99 ETH" />,
        );

        expect(
            getByText(
                getTranslation('moduleTrading.tradeHistory.detail.info.minimumReceivedAmount'),
            ),
        ).toBeOnTheScreen();
        expect(getByText('0.99 ETH')).toBeOnTheScreen();
    });
});
