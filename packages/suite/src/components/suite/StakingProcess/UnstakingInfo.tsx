import React from 'react';
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
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';

interface UnstakingInfoProps {
    isExpanded?: boolean;
}

export const UnstakingInfo = ({ isExpanded }: UnstakingInfoProps) => {
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const { data } =
        useSelector((state: StakeRootState) => selectValidatorsQueue(state, account?.symbol)) || {};

    const unstakeTxs = useSelector((state: TransactionsRootState) =>
        selectAccountUnstakeTransactions(state, account?.key ?? ''),
    );

    if (!account) return null;

    const daysToUnstake = getDaysToUnstake(unstakeTxs, data);
    const accountSymbol = account.symbol.toUpperCase();

    const infoRows = [
        {
            heading: <Translation id="TR_STAKE_SIGN_UNSTAKING_TRANSACTION" />,
            subheading: { isCurrentStep: true },
            content: {
                text: <Translation id="TR_COINMARKET_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            heading: <Translation id="TR_STAKE_LEAVE_STAKING_POOL" />,
            subheading: {
                text: (
                    <Translation
                        id="TR_STAKING_CONSOLIDATING_FUNDS"
                        values={{ symbol: accountSymbol }}
                    />
                ),
            },
            content: {
                text: <Translation id="TR_STAKE_DAYS" values={{ count: daysToUnstake }} />,
            },
        },
        {
            heading: (
                <Translation id="TR_STAKE_CLAIM_UNSTAKED" values={{ symbol: accountSymbol }} />
            ),
            subheading: {
                text: (
                    <Translation
                        id="TR_STAKING_YOUR_UNSTAKED_FUNDS"
                        values={{ symbol: accountSymbol }}
                    />
                ),
            },
            content: {
                text: <Translation id="TR_COINMARKET_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            heading: <Translation id="TR_STAKE_IN_ACCOUNT" values={{ symbol: accountSymbol }} />,
            subheading: null,
            content: { text: null },
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
