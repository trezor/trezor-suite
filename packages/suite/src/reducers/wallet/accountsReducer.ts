import produce from 'immer';
import { ACCOUNT } from '@wallet-actions/constants';
import { Action } from '@wallet-types/index';
import { AccountInfo } from 'trezor-connect';

export interface Account extends AccountInfo {
    index: number;
    accountType: 'normal' | 'segwit' | 'legacy';
    type: 'bitcoin' | 'ethereum' | 'ripple';
    network: string;
    path: string;
    imported?: boolean;
    deviceState: string;
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
    networkShortcut?: string,
) => {
    // TODO: should also filter deviceState
    if (networkShortcut) {
        return accounts.filter(a => a.network === networkShortcut);
    }
    return accounts;
};

const update = (draft: Account[], updatedAccount: Account) => {
    const accountIndex = draft.findIndex(
        a => a.descriptor === updatedAccount.descriptor && a.network === updatedAccount.network,
    );
    console.log('accountIndex', accountIndex)
    if (accountIndex !== -1) {
        console.log('acc to update', draft[accountIndex]);
        draft[accountIndex].marker = updatedAccount.marker;
        // draft.splice(accountIndex, 1);
        // draft.push(updatedAccount);
    }

    // const account = draft.find(a => a.descriptor === updatedAccount.descriptor);
    // if (account) {
    //     console.log('updatujem');
    //     account.marker = updatedAccount.marker;
    // }
};

export default (state: Account[] = initialState, action: Action): Account[] => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                draft.push(action.payload);
                break;
            case ACCOUNT.UPDATE:
                update(draft, action.payload);
                break;
            // no default
        }
    });
};
