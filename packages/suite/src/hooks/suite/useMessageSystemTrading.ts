import { useSelector } from 'react-redux';

import { selectLanguage } from '@suite/settings';
import {
    Feature,
    type MessageSystemRootState,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type TradingTypeWithConcierge } from '@suite-common/trading';

export const useMessageSystemTrading = (type: TradingTypeWithConcierge) => {
    const language = useSelector(selectLanguage);

    const isDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.trading[type]),
    );

    const content = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessageContent(state, Feature.trading[type], language),
    );

    return {
        isDisabled,
        content,
    };
};
