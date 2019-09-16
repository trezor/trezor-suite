import produce from 'immer';
import { ACCOUNT } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import { AccountInfo } from 'trezor-connect';

export interface Account {
    deviceState: string;
    index: number;
    path: string;
    descriptor: string;
    accountType: 'normal' | 'segwit' | 'legacy';
    networkType: 'bitcoin' | 'ethereum' | 'ripple';
    symbol: string;
    empty: boolean;
    visible: boolean;
    imported?: boolean;
    balance: string;
    availableBalance: string;
    tokens: AccountInfo['tokens'];
    addresses: AccountInfo['addresses'];
    utxo: AccountInfo['utxo'];
    history: AccountInfo['history'];
    misc: AccountInfo['misc'];
    marker: AccountInfo['marker'];
}

export const initialState: Account[] = [];

// const create = (state: Account[], action: Action) => {
// const { network, rates } = action;
// const affected = state.find(f => f.network === network);
// Object.keys(rates).map(k => rates[k].toFixed(2));
// if (!affected) {
//     state.push({
//         network,
//         rates,
//     });
// } else {
//     affected.network = network;
//     affected.rates = rates;
// }
// };

const create = (draft: Account[], account: Account) => {
    // TODO: check if account already exist, for example 2 device instances with same passphrase
    // remove "transactions" field, they are stored in "transactionReducer"
    if (account.history) {
        delete account.history.transactions;
    }
    draft.push(account);
};

export default (state: Account[] = initialState, action: Action): Account[] => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                create(draft, action.payload);
                break;
            // no default
        }
    });
};
