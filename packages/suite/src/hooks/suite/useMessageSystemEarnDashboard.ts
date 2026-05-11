import { selectLanguage } from '@suite/settings';
import {
    Context,
    Feature,
    selectContextMessageContent,
    selectFeatureMessage,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';

import { useSelector } from './useSelector';

export type EarnDashboardType = keyof typeof Feature.earn.dashboard;

export const useMessageSystemEarnDashboard = (type: EarnDashboardType) => {
    const language = useSelector(selectLanguage);

    const isDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.earn.dashboard[type]),
    );

    const featureMessage = useSelector(state =>
        selectFeatureMessage(state, Feature.earn.dashboard[type]),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.earn.dashboard[type], language),
    );
    const contextMessage = useSelector(state =>
        selectContextMessageContent(state, Context.getEarnDashboard(type), language),
    );

    const content = featureMessage ? featureMessageContent : contextMessage?.content;
    const variant = featureMessage?.variant ?? contextMessage?.variant;

    return {
        isDisabled,
        content,
        variant,
    };
};
