import { Feature, messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { PortfolioAssetsEmptyState } from './PortfolioAssetsEmptyState';

const RECEIVE_BUTTON = '@home/portfolio-assets/empty-state/receive-button';
const BUY_BUTTON = '@home/portfolio-assets/empty-state/buy-button';

const renderPortfolioAssetsEmptyState = async (messageSystem = messageSystemInitialState) =>
    await renderWithStoreProvider(<PortfolioAssetsEmptyState />, {
        preloadedState: {
            messageSystem,
            device: { devices: [], selectedDevice: undefined },
            wallet: { trading: { residence: {} } },
        },
        services: { analytics: mockNativeAnalytics(jest.fn()) },
    });

describe('PortfolioAssetsEmptyState', () => {
    it('invites to receive or buy crypto', async () => {
        await renderPortfolioAssetsEmptyState();

        expect(screen.getByText(getTranslation('moduleHome.assets.emptyState.title'))).toBeTruthy();
        expect(
            screen.getByText(getTranslation('moduleHome.assets.emptyState.subtitle')),
        ).toBeTruthy();
        expect(screen.getByTestId(RECEIVE_BUTTON)).toBeTruthy();
        expect(screen.getByTestId(BUY_BUTTON)).toBeTruthy();
    });

    it('hides the buy button when buying is disabled', async () => {
        await renderPortfolioAssetsEmptyState(
            mockMessageSystemStateWithFeatureFlags({ [Feature.trading.buy]: false }),
        );

        expect(screen.getByTestId(RECEIVE_BUTTON)).toBeTruthy();
        expect(screen.queryByTestId(BUY_BUTTON)).toBeNull();
    });
});
