import { selectIsFeatureFlagEnabled } from './featureFlagsSelectors';
import { featureFlagsReducer, toggleFeatureFlag } from './featureFlagsSlice';

describe('featureFlagsSelectors', () => {
    describe('selectIsFeatureFlagEnabled', () => {
        it('should return correct value', () => {
            const state = featureFlagsReducer(
                undefined,
                toggleFeatureFlag({ featureFlag: 'areDebugOnlyNetworksEnabled' }),
            );

            expect(
                selectIsFeatureFlagEnabled({ featureFlags: state }, 'areDebugOnlyNetworksEnabled'),
            ).toEqual(true);
        });
    });
});
