import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { ResidenceCheckAwareAnimatedBox } from '../ResidenceCheckAwareAnimatedBox';

describe('ResidenceCheckAwareAnimatedBox', () => {
    const renderResidenceCheckAwareAnimatedBox = (preloadedState = {}) =>
        renderWithStoreProvider(<ResidenceCheckAwareAnimatedBox testID="TEST_ID" />, {
            preloadedState,
        });

    it('should have no border when residence check is enabled', () => {
        const { getByTestId } = renderResidenceCheckAwareAnimatedBox({
            featureFlags: { isTradingResidenceCheckEnabled: true },
        });

        expect(getByTestId('TEST_ID')).not.toHaveStyle({
            borderTopWidth: 1,
        });
    });

    it('should have border when residence check is disabled', () => {
        const { getByTestId } = renderResidenceCheckAwareAnimatedBox({
            featureFlags: { isTradingResidenceCheckEnabled: false },
        });

        expect(getByTestId('TEST_ID')).toHaveStyle({
            borderTopWidth: 1,
        });
    });
});
