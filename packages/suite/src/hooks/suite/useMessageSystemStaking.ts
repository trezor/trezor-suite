import {
    Feature,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { selectLanguage } from 'src/reducers/suite/suiteReducer';

import { useSelector } from './useSelector';

type AvailableNetworkSymbols = Extract<NetworkSymbol, 'eth' | 'sol'>;
const availableNetworks = [
    ...Object.keys(Feature.stake),
    ...Object.keys(Feature.unstake),
    ...Object.keys(Feature.claim),
] as NetworkSymbol[];

export const useMessageSystemStaking = (networkSymbol?: NetworkSymbol) => {
    const language = useSelector(selectLanguage);

    const isAvailable = networkSymbol != null && availableNetworks.includes(networkSymbol);

    const stake = isAvailable ? Feature.stake[networkSymbol as AvailableNetworkSymbols] : undefined;
    const unstake = isAvailable
        ? Feature.unstake[networkSymbol as AvailableNetworkSymbols]
        : undefined;
    const claim = isAvailable ? Feature.claim[networkSymbol as AvailableNetworkSymbols] : undefined;

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
