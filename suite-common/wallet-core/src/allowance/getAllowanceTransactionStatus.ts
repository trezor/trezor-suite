import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

export type AllowanceTransactionStatus =
    | {
          isPending: false;
          isConfirmed: false;
          isFailed: false;
      }
    | {
          isPending: true;
          isConfirmed: false;
          isFailed: false;
      }
    | {
          isPending: false;
          isConfirmed: true;
          isFailed: false;
      }
    | {
          isPending: false;
          isConfirmed: false;
          isFailed: true;
      };

export const getAllowanceTransactionStatus = (
    transaction: WalletAccountTransaction | null | undefined,
): AllowanceTransactionStatus => {
    if (!transaction) {
        return { isPending: false, isConfirmed: false, isFailed: false };
    }

    if (isPending(transaction)) {
        return { isPending: true, isConfirmed: false, isFailed: false };
    }

    if (transaction.type === 'failed') {
        return { isPending: false, isConfirmed: false, isFailed: true };
    }

    return { isPending: false, isConfirmed: true, isFailed: false };
};
