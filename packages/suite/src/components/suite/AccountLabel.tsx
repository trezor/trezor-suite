import React from 'react';
import styled from 'styled-components';
import { getTitleForNetwork, getTitleForCoinJoinAccount } from '@suite-common/wallet-utils';
import { Translation } from '@suite-components';
import { Account } from '@wallet-types';

const TabularNums = styled.span`
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface AccountLabelProps {
    accountLabel?: string;
    accountType: Account['accountType'];
    symbol: Account['symbol'];
    index?: number;
}

export const AccountLabel = ({
    accountLabel,
    accountType,
    symbol,
    index = 0,
}: AccountLabelProps) => {
    if (accountLabel) {
        return <TabularNums>{accountLabel}</TabularNums>;
    }

    if (accountType === 'coinjoin') {
        return <Translation id={getTitleForCoinJoinAccount(symbol)} />;
    }

    return (
        <Translation
            id="LABELING_ACCOUNT"
            values={{
                networkName: <Translation id={getTitleForNetwork(symbol)} />, // Bitcoin, Ethereum, ...
                index: index + 1, // this is the number which shows after hash, e.g. Ethereum #3
            }}
        />
    );
};
