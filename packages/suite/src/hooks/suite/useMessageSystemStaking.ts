import { selectLanguage } from '@suite/settings';
import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useSelector } from './useSelector';

const availableNetworks = [
    ...Object.keys(Feature.stake),
    ...Object.keys(Feature.unstake),
    ...Object.keys(Feature.claim),
] as NetworkSymbol[];

export const useMessageSystemStaking = (networkSymbol?: NetworkSymbol) => {
    const language = useSelector(selectLanguage);

    const isAvailable = networkSymbol != null && availableNetworks.includes(networkSymbol);
    const isStaking = isAvailable && networkSymbol in Feature.stake;
    const key = networkSymbol as keyof typeof Feature.stake;

    const stake = isStaking ? Feature.stake[key] : undefined;
    const unstake = isStaking ? Feature.unstake[key] : undefined;
    const claim = isStaking ? Feature.claim[key] : undefined;

    const isStakingDisabled = useSelector(state =>
        stake ? selectIsFeatureDisabled(state, stake) : undefined,
    );
    const isUnstakingDisabled = useSelector(state =>
        unstake ? selectIsFeatureDisabled(state, unstake) : undefined,
    );
    const isClaimingDisabled = useSelector(state =>
        claim ? selectIsFeatureDisabled(state, claim) : undefined,
    );

    const stakingMessageContent = useSelector(state =>
        stake ? selectFeatureMessageContent(state, stake, language) : undefined,
    );
    const unstakingMessageContent = useSelector(state =>
        unstake ? selectFeatureMessageContent(state, unstake, language) : undefined,
    );
    const claimingMessageContent = useSelector(state =>
        claim ? selectFeatureMessageContent(state, claim, language) : undefined,
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
