import { useSelector } from 'react-redux';

import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';

export const useIsInAppRatingEnabled = () => {
    const isInAppRatingEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.inAppRating, true),
    );

    return isInAppRatingEnabled;
};
