import { selectLanguage } from '@suite/settings';
import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';

import { useSelector } from './useSelector';

type EarnDashboardType = keyof typeof Feature.earn.dashboard;

export const useMessageSystemEarnDashboard = (type: EarnDashboardType) => {
    const language = useSelector(selectLanguage);

    const isDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.earn.dashboard[type]),
    );

    const content = useSelector(state =>
        selectFeatureMessageContent(state, Feature.earn.dashboard[type], language),
    );

    return {
        isDisabled,
        content,
    };
};
