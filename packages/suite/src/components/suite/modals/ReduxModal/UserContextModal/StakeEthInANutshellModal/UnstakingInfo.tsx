import {
    selectAccountUnstakeTransactions,
    selectValidatorsQueue,
    TransactionsRootState,
    StakeRootState,
} from '@suite-common/wallet-core';
import { Translation } from 'src/components/suite';
import { InfoRow } from './InfoRow';
import { useSelector } from 'react-redux';
import { getDaysToUnstake } from 'src/utils/suite/stake';
import { Account } from 'src/types/wallet';

interface StakingInfoProps {
    account?: Account;
}
export const UnstakingInfo = ({ account }: StakingInfoProps) => {
    const { data } =
        useSelector((state: StakeRootState) => selectValidatorsQueue(state, account?.symbol)) || {};

    const unstakeTxs = useSelector((state: TransactionsRootState) =>
        selectAccountUnstakeTransactions(state, account?.key ?? ''),
    );

    if (!account) return null;

    const daysToUnstake = getDaysToUnstake(unstakeTxs, data);

    const infoRows = [
        {
            label: <Translation id="TR_STAKE_SIGN_UNSTAKING_TRANSACTION" />,
            content: {
                text: <Translation id="TR_COINMARKET_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            label: <Translation id="TR_STAKE_LEAVE_STAKING_POOL" />,
            content: {
                text: <Translation id="TR_STAKE_DAYS" values={{ count: daysToUnstake }} />,
            },
        },
        {
            label: (
                <Translation
                    id="TR_STAKE_CLAIM_UNSTAKED"
                    values={{ symbol: account?.symbol.toUpperCase() }}
                />
            ),
            content: {
                text: <Translation id="TR_COINMARKET_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            label: (
                <Translation
                    id="TR_STAKE_IN_ACCOUNT"
                    values={{ symbol: account?.symbol.toUpperCase() }}
                />
            ),
            content: { text: null },
        },
    ];

    return (
        <ol>
            {infoRows.map(({ label, content }, index) => (
                <InfoRow
                    key={index}
                    label={label}
                    content={content}
                    hasVerticalLine={index < infoRows.length - 1}
                />
            ))}
        </ol>
    );
};
