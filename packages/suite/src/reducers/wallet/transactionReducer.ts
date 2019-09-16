import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import produce from 'immer';

import { Account, Action } from '@wallet-types/index';
import { TransactionAction } from '@wallet-actions/transactionActions';
import { formatAmount } from '@wallet-utils/accountUtils';
import { AccountTransaction } from 'trezor-connect';

export interface WalletAccountTransaction extends AccountTransaction {
    id?: number;
    deviceState: string;
    descriptor: string;
    symbol: string;
}

export type State = WalletAccountTransaction[];

const initialState: State = [];

const update = (draft: State, action: TransactionAction) => {
    // @ts-ignore TODO: figure out why it doesn't pick correct action
    const tx = draft.find(tx => tx.txId === action.txId);
    if (tx) {
        // @ts-ignore TODO: figure out why it doesn't pick correct action
        tx.timestamp = action.timestamp;
    }
};

const add = (draft: State, payload: Account) => {
    if (payload.history.transactions) {
        payload.history.transactions.forEach(tx => {
            const exists = draft.find(t => t.txid === tx.txid);
            if (!exists) {
                draft.push({
                    descriptor: payload.descriptor,
                    deviceState: payload.deviceState,
                    symbol: payload.symbol,
                    ...tx,
                    amount: formatAmount(tx.amount, payload.symbol),
                    fee: formatAmount(tx.fee, payload.symbol),
                    targets: tx.targets.map(tr => {
                        if (typeof tr.amount === 'string') {
                            return {
                                ...tr,
                                amount: formatAmount(tr.amount, payload.symbol),
                            };
                        }
                        return tr;
                    }),
                });
            }
        });
    }
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                add(draft, action.payload);
                break;
            case TRANSACTION.ADD:
                draft.push(action.transaction);
                break;
            case TRANSACTION.REMOVE:
                draft.splice(draft.findIndex(tx => tx.txid === action.txId), 1);
                break;
            case TRANSACTION.UPDATE:
                update(draft, action);
                break;
            case TRANSACTION.FROM_STORAGE:
                return action.transactions;
            // no default
        }
    });
};
