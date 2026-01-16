import React, { JSX } from 'react';

import { Translation } from '@suite/intl';
import { getDaysToAddToPoolInitial } from '@suite-common/staking';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    CARDANO_ACTIVATION_PERIOD_DAYS,
    CARDANO_EPOCH_DAYS,
    SOLANA_EPOCH_DAYS,
} from '@suite-common/wallet-constants';
import { selectPoolStatsApyData, selectValidatorsQueueData } from '@suite-common/wallet-core';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { BulletList } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';
import { Account } from 'src/types/wallet';

import { InfoRow } from './InfoRow';

type InfoRowsData = {
    payoutDays: JSX.Element;
    rewardsPeriodHeading: JSX.Element;
    rewardsPeriodSubheading: JSX.Element;
    rewardsEarningHeading: JSX.Element;
};

const getInfoRowsData = (
    account: Account,
    flow: StakingFlow,
    daysToAddToPool?: number,
): InfoRowsData | null => {
    const { networkType, symbol } = account;

    if (!isStakingNetworkType(networkType)) return null;

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
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(symbol) }}
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
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(symbol) }}
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
                        values={{
                            count: CARDANO_ACTIVATION_PERIOD_DAYS,
                        }}
                    />
                ),
                rewardsPeriodHeading: (
                    <Translation
                        id={
                            flow === StakingFlow.UpdateProvider
                                ? 'TR_STAKE_KEEP_EARNING_REWARDS_WITH_CURRENT_PROVIDER'
                                : 'TR_STAKE_ENTER_ACTIVATION_PERIOD'
                        }
                        values={{ days: CARDANO_ACTIVATION_PERIOD_DAYS }}
                    />
                ),
                rewardsPeriodSubheading: <Translation id="TR_STAKE_TIME_TO_START_EARNING" />,
                rewardsEarningHeading: (
                    <Translation
                        id={
                            flow === StakingFlow.UpdateProvider
                                ? 'TR_STAKE_START_EARNING_FROM_NEW_PROVIDER'
                                : 'TR_STAKE_EARN_REWARDS_EVERY'
                        }
                        values={{ days: CARDANO_EPOCH_DAYS }}
                    />
                ),
            };
        default:
            return exhaustive(networkType);
    }
};

interface StakingInfoProps {
    isExpanded?: boolean;
    flow: StakingFlow;
}

export const StakingInfo = ({ isExpanded, flow }: StakingInfoProps) => {
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const validatorsQueue = useSelector(state => selectValidatorsQueueData(state, account?.symbol));

    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    if (!account) return null;

    // TODO: this is only for Ethereum
    const daysToAddToPoolInitial = getDaysToAddToPoolInitial(validatorsQueue);
    const infoRowsData = getInfoRowsData(account, flow, daysToAddToPoolInitial);

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
