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
    margin-right: 8px;
    white-space: nowrap;
    cursor: pointer;
`;

interface TransactionTimestampProps {
    showDate?: boolean;
    transaction: WalletAccountTransaction;
}

export const TransactionTimestamp = ({
    showDate = false,
    transaction,
}: TransactionTimestampProps) => {
    const { blockTime, blockHeight } = transaction;

    return (
        <TimestampLink>
            {blockHeight !== 0 && blockTime && blockTime > 0 && (
                <FormattedDate value={new Date(blockTime * 1000)} time date={showDate} />
            )}
        </TimestampLink>
    );
};
