import { useSelector } from 'react-redux';

import {
    selectContextMessageContent,
    selectFeatureMessage,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from './messageSystemSelectors';
import {
    Context,
    type EarnDashboardType,
    Feature,
    type MessageSystemRootState,
} from './messageSystemTypes';

interface UseMessageSystemEarnDashboardProps {
    type: EarnDashboardType;
    locale: string;
}

export const useMessageSystemEarnDashboard = ({
    type,
    locale,
}: UseMessageSystemEarnDashboardProps) => {
    const isDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.earn.dashboard[type]),
    );

    const featureMessage = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessage(state, Feature.earn.dashboard[type]),
    );
    const featureMessageContent = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessageContent(state, Feature.earn.dashboard[type], locale),
    );
    const contextMessage = useSelector((state: MessageSystemRootState) =>
        selectContextMessageContent(state, Context.getEarnDashboard(type), locale),
    );

    const content = featureMessage ? featureMessageContent : contextMessage?.content;
    const variant = featureMessage?.variant ?? contextMessage?.variant;

    return {
        isDisabled,
        content,
        variant,
    };
};
