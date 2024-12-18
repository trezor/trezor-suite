import React from 'react';
import { useSelector } from 'react-redux';

import { BulletList } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    selectAccountStakeTransactions,
    selectValidatorsQueue,
    TransactionsRootState,
    StakeRootState,
    selectPoolStatsApyData,
    AccountsRootState,
} from '@suite-common/wallet-core';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { getNetworkDisplaySymbol, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { getDaysToAddToPool } from 'src/utils/suite/ethereumStaking';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';

import { InfoRow } from './InfoRow';

type InfoRowsData = {
    payoutDays: number | undefined;
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
                payoutDays: daysToAddToPool,
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
                payoutDays: SOLANA_EPOCH_DAYS,
                rewardsPeriodHeading: <Translation id="TR_STAKE_WARM_UP_PERIOD" />,
                rewardsPeriodSubheading: <Translation id="TR_STAKE_WAIT_FOR_ACTIVATION" />,
                rewardsEarningHeading: (
                    <Translation
                        id="TR_STAKE_EARN_REWARDS_EVERY"
                        values={{ days: SOLANA_EPOCH_DAYS }}
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

    const { data } =
        useSelector((state: StakeRootState) => selectValidatorsQueue(state, account?.symbol)) || {};

    const stakeTxs = useSelector((state: TransactionsRootState & AccountsRootState) =>
        selectAccountStakeTransactions(state, account?.key ?? ''),
    );

    const apy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, account?.symbol),
    );

    if (!account) return null;

    const daysToAddToPool = getDaysToAddToPool(stakeTxs, data);
    const infoRowsData = getInfoRowsData(account.networkType, account.symbol, daysToAddToPool);

    const infoRows = [
        {
            heading: <Translation id="TR_STAKE_SIGN_TRANSACTION" />,
            content: { text: <Translation id="TR_COINMARKET_NETWORK_FEE" />, isBadge: true },
        },
        {
            heading: infoRowsData?.rewardsPeriodHeading,
            subheading: infoRowsData?.rewardsPeriodSubheading,
            content: {
                text: (
                    <>
                        ~
                        <Translation
                            id="TR_STAKE_DAYS"
                            values={{ count: infoRowsData?.payoutDays }}
                        />
                    </>
                ),
            },
        },
        {
            heading: infoRowsData?.rewardsEarningHeading,
            subheading: <Translation id="TR_STAKING_REWARDS_ARE_RESTAKED" />,
            content: { text: `~${apy}% p.a.` },
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
