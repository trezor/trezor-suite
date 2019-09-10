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
    history: Omit<AccountInfo['history'], 'transactions' | 'txids'>;
    misc: AccountInfo['misc'];
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

export const findDeviceAccounts = (
    accounts: Account[],
    // device: TrezorDevice,
    symbol?: string,
) => {
    // TODO: should also filter deviceState
    if (symbol) {
        return accounts.filter(a => a.symbol === symbol);
    }
    return accounts;
};

export default (state: Account[] = initialState, action: Action): Account[] => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                draft.push(action.payload);
                break;
            // no default
        }
    });
};
