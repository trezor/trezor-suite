import React from 'react';
import {
    selectAccountStakeTransactions,
    selectValidatorsQueue,
    TransactionsRootState,
    StakeRootState,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import { useSelector } from 'react-redux';
import { Translation } from 'src/components/suite';
import { getDaysToAddToPool } from 'src/utils/suite/stake';
import { InfoRow } from './InfoRow';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';

interface StakingInfoProps {
    isExpanded?: boolean;
}

export const StakingInfo = ({ isExpanded }: StakingInfoProps) => {
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const { data } =
        useSelector((state: StakeRootState) => selectValidatorsQueue(state, account?.symbol)) || {};

    const stakeTxs = useSelector((state: TransactionsRootState) =>
        selectAccountStakeTransactions(state, account?.key ?? ''),
    );

    const ethApy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, account?.symbol),
    );

    if (!account) return null;

    const daysToAddToPool = getDaysToAddToPool(stakeTxs, data);

    const infoRows = [
        {
            heading: <Translation id="TR_STAKE_SIGN_TRANSACTION" />,
            subheading: { isCurrentStep: true },
            content: { text: <Translation id="TR_COINMARKET_NETWORK_FEE" />, isBadge: true },
        },
        {
            heading: <Translation id="TR_STAKE_ENTER_THE_STAKING_POOL" />,
            subheading: {
                text: (
                    <Translation
                        id="TR_STAKING_GETTING_READY"
                        values={{ symbol: account.symbol.toUpperCase() }}
                    />
                ),
            },
            content: {
                text: (
                    <>
                        ~<Translation id="TR_STAKE_DAYS" values={{ count: daysToAddToPool }} />
                    </>
                ),
            },
        },
        {
            heading: <Translation id="TR_STAKE_EARN_REWARDS_WEEKLY" />,
            subheading: { text: <Translation id="TR_STAKING_REWARDS_ARE_RESTAKED" /> },
            content: { text: `~${ethApy}% p.a.` },
        },
    ];

    return (
        <>
            {infoRows.map(({ heading, content, subheading }, index) => (
                <InfoRow key={index} {...{ heading, subheading, content, isExpanded }} />
            ))}
        </>
    );
};
