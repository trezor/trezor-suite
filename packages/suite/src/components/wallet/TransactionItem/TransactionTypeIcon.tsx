import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { IconCircle } from '@trezor/components';

import { getTransactionIcon } from '#src/utils/wallet/transactionIconUtils';

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
        icon={getTransactionIcon(transaction, isPhishingTransaction)}
        intent={getIconIntent(transaction.type, isPending, isPhishingTransaction)}
        size={40}
    />
);
