import produce from 'immer';
import { AccountTransaction } from 'trezor-connect';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { formatAmount, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getAccountKey } from '@wallet-utils/reducerUtils';
import { SETTINGS } from '@suite-config';
import { Account, WalletAction } from '@wallet-types';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    page?: number;
    deviceState: string;
    descriptor: string;
    symbol: string;
}

export interface State {
    transactions: { [key: string]: WalletAccountTransaction[] }; // object where a key is accountHash and a value is sparse array of fetched txs
    isLoading: boolean;
    error: string | null;
}

const initialState: State = {
    transactions: {},
    isLoading: false,
    error: null,
};

// const sortByBlockHeight = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
//     // if both are missing the blockHeight don't change their order
//     if (!a.blockHeight && !b.blockHeight) return 0;
//     // tx with no blockHeight comes first
//     if (!a.blockHeight) return -1;
//     if (!b.blockHeight) return 1;
//     return b.blockHeight - a.blockHeight;
// };

const enhanceTransaction = (tx: AccountTransaction, account: Account): WalletAccountTransaction => {
    return {
        descriptor: account.descriptor,
        deviceState: account.deviceState,
        symbol: account.symbol,
        ...tx,
        tokens: tx.tokens.map(tok => {
            return {
                ...tok,
                amount: formatAmount(tok.amount, tok.decimals),
            };
        }),
        amount: formatNetworkAmount(tx.amount, account.symbol),
        fee: formatNetworkAmount(tx.fee, account.symbol),
        targets: tx.targets.map(tr => {
            if (typeof tr.amount === 'string') {
                return {
                    ...tr,
                    amount: formatNetworkAmount(tr.amount, account.symbol),
                };
            }
            return tr;
        }),
    };
};

const initializeAccount = (draft: State, accountHash: string) => {
    // initialize an empty array at 'accountHash' index if not yet initialized
    if (!draft.transactions[accountHash]) {
        draft.transactions[accountHash] = [];
    }
};

const alreadyExists = (
    transactions: WalletAccountTransaction[],
    transaction: WalletAccountTransaction,
) => {
    // first we need to make sure that tx is not undefined, then check if txid matches
    return transactions.find(t => t && t.txid === transaction.txid);
};

const add = (draft: State, transactions: AccountTransaction[], account: Account, page?: number) => {
    const accountHash = getAccountKey(account.descriptor, account.symbol, account.deviceState);
    initializeAccount(draft, accountHash);
    const accountTxs = draft.transactions[accountHash];
    if (!accountTxs) return;

    transactions.forEach((tx, i) => {
        const enhancedTx = enhanceTransaction(tx, account);
        const existingTx = alreadyExists(accountTxs, enhancedTx);

        if (!existingTx) {
            // add a new transaction
            if (page) {
                console.log('inserting at page', enhancedTx.txid);
                // insert a tx object at correct index
                const txIndex = (page - 1) * SETTINGS.TXS_PER_PAGE + i;
                accountTxs[txIndex] = enhancedTx;
            } else {
                // no page arg, insert the tx at the beginning of the array
                console.log('inserting at start', enhancedTx.txid);
                accountTxs.unshift(enhancedTx);
            }
        } else {
            // update the transaction if conditions are met
            const existingTxIndex = accountTxs.findIndex(t => t && t.txid === existingTx.txid);
            // eslint-disable-next-line no-lonely-if
            if (!existingTx.blockTime && enhancedTx.blockTime) {
                console.log('replacing index', existingTxIndex, 'txid', existingTx.txid);
                // pending tx got confirmed (blockTime changed from undefined to a number)
                accountTxs[existingTxIndex] = { ...enhancedTx };
            }
        }
    });
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                // gather transactions from account.create action
                add(draft, action.payload.history.transactions || [], action.payload, 1);
                break;
            case TRANSACTION.ADD:
                add(draft, action.transactions, action.account, action.page);
                break;
            case TRANSACTION.REMOVE:
                delete draft.transactions[
                    getAccountKey(
                        action.account.descriptor,
                        action.account.symbol,
                        action.account.deviceState,
                    )
                ];
                break;
            case TRANSACTION.UPDATE:
                // TODO
                break;
            case TRANSACTION.FETCH_INIT:
                draft.isLoading = true;
                break;
            case TRANSACTION.FETCH_SUCCESS:
                add(draft, action.transactions, action.account, action.page);
                draft.isLoading = false;
                break;
            case TRANSACTION.FETCH_ERROR:
                draft.error = action.error;
                draft.isLoading = false;
                break;
            // case TRANSACTION.FROM_STORAGE:
            //     draft.transactions = action.transactions;
            // no default
        }
    });
};
