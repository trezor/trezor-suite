import { isStakingTransaction } from '@suite-common/staking';
import { isSwapTransaction } from '@suite-common/wallet-utils';
import { type IconComponent } from '@trezor/components';
import {
    ArrowDownIcon,
    ArrowURightDownIcon,
    ArrowUpIcon,
    ArrowsDownUpIcon,
    FileCodeIcon,
    GhostIcon,
    PiggyBankIcon,
    QuestionSimpleIcon,
    ShuffleIcon,
    XIcon,
} from '@trezor/icons';

import { type WalletAccountTransaction } from 'src/types/wallet';

export const getTransactionIcon = (
    transaction: WalletAccountTransaction,
    isPhishingTransaction: boolean,
): IconComponent => {
    if (isPhishingTransaction) {
        return GhostIcon;
    }

    if (isSwapTransaction(transaction)) {
        return ArrowsDownUpIcon;
    }

    if (isStakingTransaction(transaction)) {
        return PiggyBankIcon;
    }

    switch (transaction.type) {
        case 'recv':
            return ArrowDownIcon;
        case 'sent':
            return ArrowUpIcon;
        case 'self':
            return ArrowURightDownIcon;
        case 'contract':
            return FileCodeIcon;
        case 'joint':
            return ShuffleIcon;
        case 'failed':
            return XIcon;
        default:
            return QuestionSimpleIcon;
    }
};
