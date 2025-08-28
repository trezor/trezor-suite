import { memo } from 'react';
import { useSelector } from 'react-redux';

import { ExperimentalFeature } from 'src/constants/suite/experimental';
import { selectHasExperimentalFeature } from 'src/selectors/suite/suiteSelectors';

export const ExperimentalFeatureFlag = memo(
    ({
        children,
        feature,
        featureFlagDisabled,
    }: {
        children: React.ReactNode;
        feature: ExperimentalFeature;
        featureFlagDisabled?: boolean;
    }) => {
        const experimentalFeatures = useSelector(selectHasExperimentalFeature(feature));

        if (featureFlagDisabled) {
            return children;
        }

        return experimentalFeatures ? children : null;
    },
);

ExperimentalFeatureFlag.displayName = 'ExperimentalFeatureFlag';
