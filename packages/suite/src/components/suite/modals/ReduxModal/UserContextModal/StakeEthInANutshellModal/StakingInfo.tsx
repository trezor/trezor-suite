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
import { Account } from 'src/types/wallet';

interface StakingInfoProps {
    account?: Account;
}

export const StakingInfo = ({ account }: StakingInfoProps) => {
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
            label: <Translation id="TR_STAKE_SIGN_TRANSACTION" />,
            content: { text: <Translation id="TR_COINMARKET_NETWORK_FEE" />, isBadge: true },
        },
        {
            label: <Translation id="TR_STAKE_ENTER_THE_STAKING_POOL" />,
            content: {
                text: (
                    <>
                        ~<Translation id="TR_STAKE_DAYS" values={{ count: daysToAddToPool }} />
                    </>
                ),
            },
        },
        {
            label: <Translation id="TR_STAKE_EARN_REWARDS_WEEKLY" />,
            content: { text: `~${ethApy}% p.a.` },
        },
    ];

    return (
        <>
            {infoRows.map(({ label, content }, index) => (
                <InfoRow key={index} label={label} content={content} />
            ))}
        </>
    );
};
