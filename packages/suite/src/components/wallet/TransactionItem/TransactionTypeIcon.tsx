import { getTxIcon } from '@suite-common/wallet-utils';
import { IconCircle } from '@trezor/components';

import { WalletAccountTransaction } from 'src/types/wallet';

type TransactionTypeIconProps = {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isPhishingTransaction: boolean;
};

const getIconIntent = (
    type: WalletAccountTransaction['type'],
    isPending: boolean,
    isPhishingTransaction: boolean,
) => {
    if (isPending) {
        return 'warning';
    } else if (isPhishingTransaction || type === 'failed') {
        return 'critical';
    } else {
        return 'neutral';
    }
};

export const TransactionTypeIcon = ({
    transaction,
    isPending,
    isPhishingTransaction,
}: TransactionTypeIconProps) => (
    <IconCircle
        name={getTxIcon(transaction, isPhishingTransaction)}
        intent={getIconIntent(transaction.type, isPending, isPhishingTransaction)}
        size={40}
    />
);
