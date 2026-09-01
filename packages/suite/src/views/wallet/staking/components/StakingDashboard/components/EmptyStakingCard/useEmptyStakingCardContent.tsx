import { type ReactNode } from 'react';

import { type DesktopAnalyticsDep, events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type Dispatch, useDispatch } from '@suite-common/redux-utils';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { type IconComponent, Tooltip } from '@trezor/components';
import {
    EverstakeLogoIcon,
    HandCoinsIcon,
    LightningIcon,
    LockLaminatedOpenIcon,
    PiggyBankIcon,
    SnowflakeIcon,
    WalletIcon,
} from '@trezor/icons';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';

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
    icon: IconComponent;
}

export interface EmptyStakingCardContent {
    title: ReactNode;
    text: ReactNode;
    features: EmptyStakingCardContentFeature[];
    onStartStakingClick: () => void;
}

interface UseNetworkContentProps {
    data: EmptyStakingCardData;
    dispatch: Dispatch;
}

const getTronContent = ({
    data,
    dispatch,
    analytics,
}: UseNetworkContentProps & {
    analytics: DesktopAnalyticsDep['analytics'];
}): EmptyStakingCardContent => {
    const rate = formatApyValue(data.rate);
    const { displaySymbol, isStartStakingDisabled, account } = data;

    const title = (
        <Translation id="TR_STAKING_CARD_TITLE_TRON" values={{ apr: rate, displaySymbol }} />
    );

    const text = <Translation id="TR_STAKING_CARD_TEXT_TRON" />;

    const features = [
        {
            id: 0,
            icon: LightningIcon,
            title: <Translation id="TR_STAKING_CARD_GET_RESOURCES_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_GET_RESOURCES_TEXT" />,
        },
        {
            id: 1,
            icon: SnowflakeIcon,
            title: <Translation id="TR_STAKING_CARD_FREEZE_AND_VOTE_TITLE" />,
            text: <Translation id="TR_STAKING_CARD_FREEZE_AND_VOTE_TEXT" />,
        },
        {
            id: 2,
            icon: LockLaminatedOpenIcon,
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

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return { title, text, features, onStartStakingClick };
};

const getCardanoContent = ({ data, dispatch }: UseNetworkContentProps): EmptyStakingCardContent => {
    const rate = formatApyValue(data.rate);

    const {
        displaySymbol,
        isStartStakingDisabled,
        account,
        hasEnoughBalanceForStaking,
        hasPotentialRewards,
        potentialRewards,
    } = data;

    const title = <Translation id="TR_STAKING_CARD_TITLE" values={{ apy: rate, displaySymbol }} />;

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
            icon: PiggyBankIcon,
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
            icon: WalletIcon,
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
            icon: HandCoinsIcon,
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
    const rate = formatApyValue(data.rate);

    const {
        displaySymbol,
        isStartStakingDisabled,
        account,
        hasEnoughBalanceForStaking,
        hasPotentialRewards,
        potentialRewards,
    } = data;

    const title = <Translation id="TR_STAKING_CARD_TITLE" values={{ apy: rate, displaySymbol }} />;

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
            icon: PiggyBankIcon,
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
            icon: LockLaminatedOpenIcon,
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
            icon: EverstakeLogoIcon,
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    switch (variant) {
        case 'tron':
            return getTronContent({ data, dispatch, analytics });
        case 'cardano':
            return getCardanoContent({ data, dispatch });
        case 'default':
            return getDefaultContent({ data, dispatch });
    }
};
