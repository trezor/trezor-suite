import React from 'react';
import { useSelector } from 'react-redux';

import { BulletList } from '@trezor/components';
import { spacings } from '@trezor/theme';
import {
    selectAccountUnstakeTransactions,
    selectValidatorsQueue,
    TransactionsRootState,
    StakeRootState,
    AccountsRootState,
} from '@suite-common/wallet-core';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { getDaysToUnstake } from 'src/utils/suite/ethereumStaking';
import { CoinjoinRootState } from 'src/reducers/wallet/coinjoinReducer';

import { InfoRow } from './InfoRow';

interface UnstakingInfoProps {
    isExpanded?: boolean;
}

export const UnstakingInfo = ({ isExpanded }: UnstakingInfoProps) => {
    const { account } = useSelector((state: CoinjoinRootState) => state.wallet.selectedAccount);

    const { data } =
        useSelector((state: StakeRootState) => selectValidatorsQueue(state, account?.symbol)) || {};

    const unstakeTxs = useSelector((state: TransactionsRootState & AccountsRootState) =>
        selectAccountUnstakeTransactions(state, account?.key ?? ''),
    );

    if (!account) return null;

    const daysToUnstake = getDaysToUnstake(unstakeTxs, data);
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    const infoRows = [
        {
            heading: <Translation id="TR_STAKE_SIGN_UNSTAKING_TRANSACTION" />,
            content: {
                text: <Translation id="TR_COINMARKET_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            heading: <Translation id="TR_STAKE_LEAVE_STAKING_POOL" />,
            subheading: (
                <Translation
                    id="TR_STAKING_CONSOLIDATING_FUNDS"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
            content: {
                text: <Translation id="TR_STAKE_DAYS" values={{ count: daysToUnstake }} />,
            },
        },
        {
            heading: (
                <Translation
                    id="TR_STAKE_CLAIM_UNSTAKED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
            subheading: (
                <Translation
                    id="TR_STAKING_YOUR_UNSTAKED_FUNDS"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
            content: {
                text: <Translation id="TR_COINMARKET_NETWORK_FEE" />,
                isBadge: true,
            },
        },
        {
            heading: (
                <Translation
                    id="TR_STAKE_IN_ACCOUNT"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
        },
    ];

    return (
        <BulletList
            bulletGap={spacings.sm}
            gap={spacings.md}
            bulletSize="small"
            titleGap={spacings.xxs}
        >
            {infoRows.map(({ heading, content, subheading }, index) => (
                <InfoRow key={index} {...{ heading, subheading, content, isExpanded }} />
            ))}
        </BulletList>
    );
};
