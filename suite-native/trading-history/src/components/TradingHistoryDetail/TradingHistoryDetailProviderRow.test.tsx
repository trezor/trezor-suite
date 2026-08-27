import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailProviderRow } from './TradingHistoryDetailProviderRow';

describe('TradingHistoryDetailProviderRow', () => {
    it('renders the provider', async () => {
        const { getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailProviderRow provider={{ name: 'Mercuryo' }} />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.provider')),
        ).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
