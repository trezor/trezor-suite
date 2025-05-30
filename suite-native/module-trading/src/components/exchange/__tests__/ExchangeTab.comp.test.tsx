import { FeatureFlag } from '@suite-native/feature-flags';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ExchangeTab } from '../ExchangeTab';

describe('ExchangeTab', () => {
    const renderExchangeTab = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<ExchangeTab />, { preloadedState });

    it('should render tab placeholder', async () => {
        const { getByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: true,
            },
        });

        expect(getByText('Exchange Tab placeholder')).toBeOnTheScreen();
    });

    it('should render disabled info when exchange FF is not enabled', async () => {
        const { getByText, queryByText } = await renderExchangeTab({
            featureFlags: {
                [FeatureFlag.IsTradingExchangeEnabled]: false,
            },
        });

        expect(queryByText('Exchange Tab placeholder')).toBeNull();
        expect(getByText('Swap disabled')).toBeOnTheScreen();
    });
});
