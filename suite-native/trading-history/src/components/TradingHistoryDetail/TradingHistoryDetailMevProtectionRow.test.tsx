import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailMevProtectionRow } from './TradingHistoryDetailMevProtectionRow';

describe('TradingHistoryDetailMevProtectionRow', () => {
    it.each([
        [true, 'enabled'],
        [false, 'disabled'],
    ] as const)('renders the %s state', async (isMevProtectionEnabled, state) => {
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailMevProtectionRow
                isMevProtectionEnabled={isMevProtectionEnabled}
            />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.mevProtection')),
        ).toBeOnTheScreen();
        expect(getByTestId(`@trading/history/detail/info/mev-${state}`)).toBeOnTheScreen();
    });
});
