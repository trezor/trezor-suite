import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'src/components/suite';
import { variables } from '@trezor/components';
import { WalletAccountTransaction } from 'src/types/wallet';

const TimestampLink = styled.div`
    display: block;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
`;

interface TransactionTimestampProps {
    showDate?: boolean;
    transaction: WalletAccountTransaction;
}

export const TransactionTimestamp = ({
    showDate = false,
    transaction,
}: TransactionTimestampProps) => {
    const { blockTime } = transaction;

    return (
        <TimestampLink>
            {blockTime && <FormattedDate value={new Date(blockTime * 1000)} time date={showDate} />}
        </TimestampLink>
    );
};
