import { selectLanguage } from '@suite/settings';
import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { useSelector } from '@suite-common/redux-utils';
import { type TradingTypeWithConcierge } from '@suite-common/trading';

export const useMessageSystemTrading = (type: TradingTypeWithConcierge) => {
    const language = useSelector(selectLanguage);

    const isDisabled = useSelector(state => selectIsFeatureDisabled(state, Feature.trading[type]));

    const content = useSelector(state =>
        selectFeatureMessageContent(state, Feature.trading[type], language),
    );

    return {
        isDisabled,
        content,
    };
};
