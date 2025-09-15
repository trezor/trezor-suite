import React, { JSX } from 'react';

import { getDaysToAddToPoolInitial } from '@suite-common/staking';
import { NetworkSymbol, NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    CARDANO_ACTIVATION_PERIOD_DAYS,
    CARDANO_EPOCH_DAYS,
    SOLANA_EPOCH_DAYS,
} from '@suite-common/wallet-constants';
import {
    StakeRootState,
    selectPoolStatsApyData,
    selectValidatorsQueueData,
} from '@suite-common/wallet-core';
import { BulletList } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';

import { InfoRow } from './InfoRow';

type InfoRowsData = {
    payoutDays: JSX.Element;
    rewardsPeriodHeading: JSX.Element;
    rewardsPeriodSubheading: JSX.Element;
    rewardsEarningHeading: JSX.Element;
};

const getInfoRowsData = (
    networkType: NetworkType,
    accountSymbol: NetworkSymbol,
    daysToAddToPool?: number,
): InfoRowsData | null => {
    switch (networkType) {
        case 'ethereum':
            return {
                payoutDays: (
                    <Translation
                        id="TR_STAKE_APPROXIMATE_DAYS"
                        values={{ count: daysToAddToPool }}
                    />
                ),
                rewardsPeriodHeading: <Translation id="TR_STAKE_ENTER_THE_STAKING_POOL" />,
                rewardsPeriodSubheading: (
                    <Translation
                        id="TR_STAKING_GETTING_READY"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(accountSymbol) }}
                    />
                ),
                rewardsEarningHeading: <Translation id="TR_STAKE_EARN_REWARDS_WEEKLY" />,
            };
        case 'solana':
            return {
                payoutDays: (
                    <Translation id="TR_UP_TO_DAYS" values={{ count: SOLANA_EPOCH_DAYS }} />
                ),
                rewardsPeriodHeading: <Translation id="TR_STAKE_WARM_UP_PERIOD" />,
                rewardsPeriodSubheading: (
                    <Translation
                        id="TR_STAKE_WAIT_FOR_ACTIVATION"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(accountSymbol) }}
                    />
                ),
                rewardsEarningHeading: (
                    <Translation
                        id="TR_STAKE_EARN_REWARDS_EVERY"
                        values={{ days: SOLANA_EPOCH_DAYS }}
                    />
                ),
            };
        case 'cardano':
            return {
                payoutDays: (
                    <Translation
                        id="TR_STAKE_APPROXIMATE_DAYS"
                        values={{ count: CARDANO_ACTIVATION_PERIOD_DAYS }}
                    />
                ),
                rewardsPeriodHeading: <Translation id="TR_STAKE_ENTER_ACTIVATION_PERIOD" />,
                rewardsPeriodSubheading: <Translation id="TR_STAKE_TIME_TO_START_EARNING" />,
                rewardsEarningHeading: (
                    <Translation
                        id="TR_STAKE_EARN_REWARDS_EVERY"
                        values={{ days: CARDANO_EPOCH_DAYS }}
                    />
                ),
            };
        default:
            return null;
    }
};

interface StakingInfoProps {
    isExpanded?: boolean;
}

export const StakingInfo = ({ isExpanded }: StakingInfoProps) => {
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const validatorsQueue = useSelector(state => selectValidatorsQueueData(state, account?.symbol));

    const apy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, account?.symbol),
    );

    if (!account) return null;

    const daysToAddToPoolInitial = getDaysToAddToPoolInitial(validatorsQueue);
    const infoRowsData = getInfoRowsData(
        account.networkType,
        account.symbol,
        daysToAddToPoolInitial,
    );

    const infoRows = [
        {
            heading: <Translation id="TR_STAKE_SIGN_TRANSACTION" />,
            content: { text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true },
        },
        {
            heading: infoRowsData?.rewardsPeriodHeading,
            subheading: infoRowsData?.rewardsPeriodSubheading,
            content: {
                text: infoRowsData?.payoutDays,
            },
        },
        {
            heading: infoRowsData?.rewardsEarningHeading,
            subheading: <Translation id="TR_STAKING_REWARDS_ARE_RESTAKED" />,
            content: {
                text: <Translation id="TR_STAKE_APY_APPROX" values={{ apyPercent: apy }} />,
            },
        },
    ];

    return (
        <BulletList
            bulletGap={spacings.sm}
            gap={spacings.md}
            bulletSize="small"
            titleGap={spacings.xxxs}
        >
            {infoRows.map(({ heading, content, subheading }, index) => (
                <InfoRow key={index} {...{ heading, subheading, content, isExpanded }} />
            ))}
        </BulletList>
    );
};
