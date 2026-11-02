import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';

export const findTransactionAccount = (
    accounts: readonly Account[],
    transaction: WalletAccountTransaction,
) =>
    accounts.find(
        account =>
            account.descriptor === transaction.descriptor &&
            account.symbol === transaction.symbol &&
            account.deviceState === transaction.deviceState,
    );
