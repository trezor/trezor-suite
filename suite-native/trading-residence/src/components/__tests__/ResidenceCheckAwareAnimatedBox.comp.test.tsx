import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { ResidenceCheckAwareAnimatedBox } from '../ResidenceCheckAwareAnimatedBox';

describe('ResidenceCheckAwareAnimatedBox', () => {
    const renderResidenceCheckAwareAnimatedBox = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<ResidenceCheckAwareAnimatedBox testID="TEST_ID" />, {
            preloadedState,
        });

    it('should have no border when residence check is enabled', async () => {
        const { getByTestId } = await renderResidenceCheckAwareAnimatedBox({
            featureFlags: { isTradingResidenceCheckEnabled: true },
        });

        expect(getByTestId('TEST_ID')).not.toHaveStyle({
            borderTopWidth: 1,
        });
    });

    it('should have border when residence check is disabled', async () => {
        const { getByTestId } = await renderResidenceCheckAwareAnimatedBox({
            featureFlags: { isTradingResidenceCheckEnabled: false },
        });

        expect(getByTestId('TEST_ID')).toHaveStyle({
            borderTopWidth: 1,
        });
    });
});
