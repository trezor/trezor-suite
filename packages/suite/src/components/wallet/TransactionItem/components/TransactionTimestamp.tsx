/* eslint-disable react/no-array-index-key */
import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from '@suite-components';
import { variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-types';

const TimestampLink = styled.div`
    display: block;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
    margin-right: 8px;
    white-space: nowrap;
    cursor: pointer;
`;

interface TransactionTimestampProps {
    transaction: WalletAccountTransaction;
}

export const TransactionTimestamp = ({ transaction }: TransactionTimestampProps) => {
    const { blockTime, blockHeight } = transaction;

    return (
        <TimestampLink>
            {blockHeight !== 0 && blockTime && blockTime > 0 && (
                <FormattedDate value={new Date(blockTime * 1000)} time />
            )}
        </TimestampLink>
    );
};
