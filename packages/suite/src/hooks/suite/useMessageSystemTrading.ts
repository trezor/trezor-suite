import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type TradingTypeWithConcierge } from '@suite-common/trading';

import { selectLanguage } from 'src/selectors/suite/suiteSelectors';

import { useSelector } from './useSelector';

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
