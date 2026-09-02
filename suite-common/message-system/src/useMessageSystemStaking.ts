import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { selectFeatureMessageContent, selectIsFeatureDisabled } from './messageSystemSelectors';
import { Feature, type MessageSystemRootState } from './messageSystemTypes';

const availableNetworks = [
    ...Object.keys(Feature.stake),
    ...Object.keys(Feature.unstake),
    ...Object.keys(Feature.claim),
    ...Object.keys(Feature.vote),
    ...Object.keys(Feature.withdraw),
] as NetworkSymbol[];

interface UseMessageSystemStakingProps {
    networkSymbol?: NetworkSymbol | null;
    locale: string;
}

export const useMessageSystemStaking = ({
    networkSymbol,
    locale,
}: UseMessageSystemStakingProps) => {
    const isAvailable = networkSymbol != null && availableNetworks.includes(networkSymbol);
    const isStaking = isAvailable && networkSymbol in Feature.stake;
    const key = networkSymbol as keyof typeof Feature.stake;

    const stake = isStaking ? Feature.stake[key] : undefined;
    const unstake = isStaking ? Feature.unstake[key] : undefined;
    const claim = isStaking ? Feature.claim[key] : undefined;
    const vote = isStaking && (key === 'trx' || key === 'ada') ? Feature.vote[key] : undefined;
    const withdraw = isStaking && key === 'trx' ? Feature.withdraw[key] : undefined;

    const isStakingDisabled = useSelector((state: MessageSystemRootState) =>
        stake ? selectIsFeatureDisabled(state, stake) : undefined,
    );
    const isUnstakingDisabled = useSelector((state: MessageSystemRootState) =>
        unstake ? selectIsFeatureDisabled(state, unstake) : undefined,
    );
    const isClaimingDisabled = useSelector((state: MessageSystemRootState) =>
        claim ? selectIsFeatureDisabled(state, claim) : undefined,
    );

    const isVotingDisabled = useSelector((state: MessageSystemRootState) =>
        vote ? selectIsFeatureDisabled(state, vote) : undefined,
    );
    const isWithdrawingDisabled = useSelector((state: MessageSystemRootState) =>
        withdraw ? selectIsFeatureDisabled(state, withdraw) : undefined,
    );

    const stakingMessageContent = useSelector((state: MessageSystemRootState) =>
        stake ? selectFeatureMessageContent(state, stake, locale) : undefined,
    );
    const unstakingMessageContent = useSelector((state: MessageSystemRootState) =>
        unstake ? selectFeatureMessageContent(state, unstake, locale) : undefined,
    );
    const claimingMessageContent = useSelector((state: MessageSystemRootState) =>
        claim ? selectFeatureMessageContent(state, claim, locale) : undefined,
    );
    const votingMessageContent = useSelector((state: MessageSystemRootState) =>
        vote ? selectFeatureMessageContent(state, vote, locale) : undefined,
    );
    const withdrawingMessageContent = useSelector((state: MessageSystemRootState) =>
        withdraw ? selectFeatureMessageContent(state, withdraw, locale) : undefined,
    );

    return {
        isStakingDisabled,
        isUnstakingDisabled,
        isClaimingDisabled,
        isVotingDisabled,
        isWithdrawingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
        claimingMessageContent,
        votingMessageContent,
        withdrawingMessageContent,
    };
};
