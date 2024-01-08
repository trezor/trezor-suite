import styled from 'styled-components';
import { FormattedDate } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { typography } from '@trezor/theme';

const TimestampLink = styled.div`
    display: block;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
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
