import {
    selectIsFeatureDisabled,
    Feature,
    selectFeatureMessageContent,
} from '@suite-common/message-system';

import { selectLanguage } from 'src/reducers/suite/suiteReducer';

import { useSelector } from './useSelector';

export const useMessageSystemStaking = () => {
    const language = useSelector(selectLanguage);

    const isStakingDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.ethStake),
    );
    const isUnstakingDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.ethUnstake),
    );
    const isClaimingDisabled = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.ethClaim),
    );
    const stakingMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.ethStake, language),
    );
    const unstakingMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.ethUnstake, language),
    );
    const claimingMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.ethClaim, language),
    );

    return {
        isStakingDisabled,
        isUnstakingDisabled,
        isClaimingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
        claimingMessageContent,
    };
};
