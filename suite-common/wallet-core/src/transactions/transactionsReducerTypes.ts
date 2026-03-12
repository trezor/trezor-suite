import type { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';

import type { AccountsRootState } from '../accounts/accountsReducer';

export type AccountTransactionsFetchStatusDetail =
    | {
          status: 'loading' | 'idle';
          error: null;
      }
    | {
          status: 'error';
          error: string;
      };

export type AccountTransactionsFetchAllStatus = {
    areAllTransactionsLoaded: boolean;
};

export interface TransactionsState {
    transactions: { [key: AccountKey]: WalletAccountTransaction[] };
    phishing: { [key: AccountKey]: string[] };
    fetchStatusDetail: {
        [key: AccountKey]: AccountTransactionsFetchStatusDetail &
            Partial<AccountTransactionsFetchAllStatus>;
    };
}

export type TransactionsRootState = {
    wallet: {
        transactions: TransactionsState & {
            // We need to override types because there could be nulls/undefined in transactions array because of pagination
            // This should be fixed in TransactionsState but it will throw lot of errors then in desktop Suite
            transactions: { [key: AccountKey]: (WalletAccountTransaction | null | undefined)[] };
        };
    };
} & AccountsRootState;
