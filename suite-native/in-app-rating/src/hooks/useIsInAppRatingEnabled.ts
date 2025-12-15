import { useSelector } from 'react-redux';

import type { MessageSystemRootState } from '@suite-common/message-system';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';

export const useIsInAppRatingEnabled = () => {
    const isInAppRatingEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.inAppRating, true),
    );

    return isInAppRatingEnabled;
};
