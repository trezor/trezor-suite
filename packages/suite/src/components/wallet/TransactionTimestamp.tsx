import { FormattedDate } from 'src/components/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

type TransactionTimestampProps = {
    transaction: WalletAccountTransaction;
    showDate?: boolean;
};

export const TransactionTimestamp = ({
    showDate = false,
    transaction,
}: TransactionTimestampProps) => {
    const { blockTime } = transaction;

    return blockTime && <FormattedDate value={new Date(blockTime * 1000)} time date={showDate} />;
};
