import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { selectLanguage } from 'src/reducers/suite/suiteReducer';

import { useSelector } from './useSelector';

export const useMessageSystemTrading = (type: TradingType) => {
    const featureFlagType: Exclude<TradingType, 'exchange'> | 'swap' =
        type === 'exchange' ? 'swap' : type;

    const language = useSelector(selectLanguage);

    const isDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.trading[featureFlagType]),
    );

    const content = useSelector(state =>
        selectFeatureMessageContent(state, Feature.trading[featureFlagType], language),
    );

    return {
        isDisabled,
        content,
    };
};
