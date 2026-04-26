import { selectLanguage } from '@suite/settings';
import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';

import type { YieldFlowType } from 'src/components/earn/yield/types';

import { useSelector } from './useSelector';

export const useMessageSystemYield = (type: YieldFlowType) => {
    const language = useSelector(selectLanguage);

    const isDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.earn.yield[type]),
    );

    const content = useSelector(state =>
        selectFeatureMessageContent(state, Feature.earn.yield[type], language),
    );

    return {
        isDisabled,
        content,
    };
};
