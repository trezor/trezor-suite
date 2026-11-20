import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { PortfolioAssetsSmallBalancesEmptyState } from './PortfolioAssetsSmallBalancesEmptyState';

describe('PortfolioAssetsSmallBalancesEmptyState', () => {
    it('reports showing small balances and asks to show them', async () => {
        const report = jest.fn();
        const onShowSmallBalancesPress = jest.fn();

        await renderWithStoreProvider(
            <PortfolioAssetsSmallBalancesEmptyState
                onShowSmallBalancesPress={onShowSmallBalancesPress}
            />,
            { services: { analytics: mockNativeAnalytics(report) } },
        );

        expect(
            screen.getByText(getTranslation('moduleHome.assets.smallBalancesEmptyState.title')),
        ).toBeTruthy();

        fireEvent.press(
            screen.getByText(
                getTranslation('moduleHome.assets.viewOptionsSheet.showSmallBalances'),
            ),
        );

        expect(report).toHaveBeenCalledWith({
            type: events.dashboardAssetListMenuEvent.name,
            payload: { type: 'show-small-balances', value: true },
        });
        expect(onShowSmallBalancesPress).toHaveBeenCalledTimes(1);
    });
});
