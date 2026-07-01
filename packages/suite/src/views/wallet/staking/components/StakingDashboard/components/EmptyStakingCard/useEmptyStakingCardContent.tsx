import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { type IconName, Tooltip } from '@trezor/components';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useDispatch } from 'src/hooks/suite';

import { type EmptyStakingCardData } from './useEmptyStakingCardData';

type NetworkVariant = 'default' | 'cardano' | 'tron';

export const getNetworkVariant = (account?: Account): NetworkVariant => {
    if (account?.networkType === 'tron') return 'tron';
    if (account?.networkType === 'cardano') return 'cardano';

    return 'default';
};

export interface EmptyStakingCardContentFeature {
    id: number;
    title: ReactNode;
    text: ReactNode;
    icon: IconName;
}

export interface EmptyStakingCardContent {
    title: ReactNode;
    text: ReactNode;
    features: EmptyStakingCardContentFeature[];
    onStartStakingClick: () => void;
}

interface UseNetworkContentProps {
    data: EmptyStakingCardData;
    dispatch: ReturnType<typeof useDispatch>;
}

const getTronContent = ({ data, dispatch }: UseNetworkContentProps): EmptyStakingCardContent => {
    const apr = formatApyValue(data.apy);
    const { displaySymbol, isStartStakingDisabled, account } = data;

    const title = <Translation id="TR_STAKING_CARD_TITLE_TRON" values={{ apr, displaySymbol }} />;

    const text = <Translation id="TR_STAKING_CARD_TEXT_TRON" />;

    const features = [
        {
            id: 0,
            icon: 'lightning' as const,
            title: <Translation id="TR_STAKING_CARD_GET_RESOURCES_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_GET_RESOURCES_TEXT" />,
        },
        {
            id: 1,
            icon: 'snowflake' as const,
            title: <Translation id="TR_STAKING_CARD_FREEZE_AND_VOTE_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_FREEZE_AND_VOTE_TEXT" />,
        },
        {
            id: 2,
            icon: 'lockLaminatedOpen' as const,
            title: <Translation id="TR_STAKING_CARD_UNSTAKE_ANYTIME_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_UNSTAKE_ANYTIME_TEXT" />,
        },
    ];

    const onStartStakingClick = () => {
        if (!account || isStartStakingDisabled) return;

        dispatch(
            goto({
                routeName: 'earn-tron-stake',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    return { title, text, features, onStartStakingClick };
};

const getCardanoContent = ({ data, dispatch }: UseNetworkContentProps): EmptyStakingCardContent => {
    const apy = formatApyValue(data.apy);

    const {
        displaySymbol,
        isStartStakingDisabled,
        account,
        hasEnoughBalanceForStaking,
        hasPotentialRewards,
        potentialRewards,
    } = data;

    const title = <Translation id="TR_STAKING_CARD_TITLE" values={{ apy, displaySymbol }} />;

    const text =
        !hasEnoughBalanceForStaking || !hasPotentialRewards ? (
            <Translation id="TR_STAKING_CARD_TEXT_EMPTY" values={{ displaySymbol }} />
        ) : (
            <Translation
                id="TR_STAKING_CARD_TEXT_EMPTY"
                values={{ potentialRewards, displaySymbol }}
            />
        );

    const features = [
        {
            id: 0,
            icon: 'piggyBank' as const,
            title: <Translation id="TR_STAKING_CARD_KEEP_EARNING_TITLE" />,
            text: (
                <Translation
                    id="TR_STAKING_CARD_KEEP_EARNING_CARDANO_TEXT"
                    values={{
                        t: text => (
                            <Tooltip
                                display="inline-flex"
                                as="span"
                                content={<Translation id="TR_STAKE_APY_DESC" />}
                            >
                                <abbr>{text}</abbr>
                            </Tooltip>
                        ),
                        networkDisplaySymbol: data.displaySymbol,
                    }}
                />
            ),
        },
        {
            id: 1,
            icon: 'wallet' as const,
            title: <Translation id="TR_STAKE_USE_ANYTIME" />,
            text: (
                <Translation
                    id="TR_STAKE_SEND_SWAP_SPEND_ANYTIME"
                    values={{ symbol: data.displaySymbol }}
                />
            ),
        },
        {
            id: 2,
            icon: 'handCoins' as const,
            title: <Translation id="TR_STAKING_CARD_RESTAKE_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_RESTAKE_TEXT" />,
        },
    ];

    const onStartStakingClick = () => {
        if (!account || isStartStakingDisabled) return;

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Stake,
                provider: EarnProvider.Everstake,
                account,
                analyticsStep: 'staking-dashboard',
            }),
        );
    };

    return { title, text, features, onStartStakingClick };
};

const getDefaultContent = ({ data, dispatch }: UseNetworkContentProps): EmptyStakingCardContent => {
    const apy = formatApyValue(data.apy);

    const {
        displaySymbol,
        isStartStakingDisabled,
        account,
        hasEnoughBalanceForStaking,
        hasPotentialRewards,
        potentialRewards,
    } = data;

    const title = <Translation id="TR_STAKING_CARD_TITLE" values={{ apy, displaySymbol }} />;

    const text =
        !hasEnoughBalanceForStaking || !hasPotentialRewards ? (
            <Translation id="TR_STAKING_CARD_TEXT_EMPTY_FUNDS_STAY" values={{ displaySymbol }} />
        ) : (
            <Translation
                id="TR_STAKING_CARD_TEXT_FUNDS_STAY"
                values={{ potentialRewards, displaySymbol }}
            />
        );

    const features = [
        {
            id: 0,
            icon: 'piggyBank' as const,
            title: <Translation id="TR_STAKING_CARD_KEEP_EARNING_TITLE" />,
            text: (
                <Translation
                    id="TR_STAKING_CARD_KEEP_EARNING_TEXT"
                    values={{
                        t: text => (
                            <Tooltip
                                display="inline-flex"
                                as="span"
                                content={<Translation id="TR_STAKE_APY_DESC" />}
                            >
                                <abbr>{text}</abbr>
                            </Tooltip>
                        ),
                        networkDisplaySymbol: data.displaySymbol,
                    }}
                />
            ),
        },
        {
            id: 1,
            icon: 'lockLaminatedOpen' as const,
            title: <Translation id="TR_STAKING_CARD_LOCK_IN_TITLE" />,
            text: (
                <Translation
                    id="TR_STAKING_CARD_LOCK_IN_TEXT"
                    values={{ symbol: data.displaySymbol }}
                />
            ),
        },
        {
            id: 2,
            icon: 'everstakeLogo' as const,
            title: <Translation id="TR_STAKING_CARD_RESTAKE_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_RESTAKE_TEXT" />,
        },
    ];

    const onStartStakingClick = () => {
        if (!account || isStartStakingDisabled) return;

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Stake,
                provider: EarnProvider.Everstake,
                account,
                analyticsStep: 'staking-dashboard',
            }),
        );
    };

    return { title, text, features, onStartStakingClick };
};

interface UseStakingCardContentProps {
    variant: NetworkVariant;
    data: EmptyStakingCardData;
}

export const useStakingCardContent = ({
    variant,
    data,
}: UseStakingCardContentProps): EmptyStakingCardContent => {
    const dispatch = useDispatch();

    switch (variant) {
        case 'tron':
            return getTronContent({ data, dispatch });
        case 'cardano':
            return getCardanoContent({ data, dispatch });
        case 'default':
            return getDefaultContent({ data, dispatch });
    }
};
