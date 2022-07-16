import produce from 'immer';
import { ACCOUNT } from '@wallet-actions/constants';
import { STORAGE, METADATA } from '@suite-actions/constants';
import { WalletAction } from '@wallet-types';
import { Action as SuiteAction } from '@suite-types';
import { Account as CommonAccount } from '@suite-common/wallet-types';

export type Account = CommonAccount;

const initialState: Account[] = [];

const accountEqualTo = (b: Account) => (a: Account) =>
    a.deviceState === b.deviceState && a.descriptor === b.descriptor && a.symbol === b.symbol;

const create = (draft: Account[], account: Account) => {
    // TODO: check if account already exist, for example 2 device instances with same passphrase
    // remove "transactions" field, they are stored in "transactionReducer"
    if (account.history) {
        delete account.history.transactions;
    }
    draft.push(account);
};

const remove = (draft: Account[], accounts: Account[]) => {
    accounts.forEach(a => {
        const index = draft.findIndex(accountEqualTo(a));
        draft.splice(index, 1);
    });
};

const update = (draft: Account[], account: Account) => {
    const accountIndex = draft.findIndex(accountEqualTo(account));

    if (accountIndex !== -1) {
        draft[accountIndex] = account;

        if (!account.marker) {
            // immer.js doesn't update fields that are set to undefined, so instead we delete the field
            delete draft[accountIndex].marker;
        }
    } else {
        console.warn(
            `Tried to update account that does not exist: ${account.descriptor} (symbol: ${account.symbol})`,
        );
    }
};

const setMetadata = (draft: Account[], account: Account) => {
    const index = draft.findIndex(a => a.key === account.key);
    if (!draft[index]) return;
    draft[index].metadata = account.metadata;
};

const accountsReducer = (
    state: Account[] = initialState,
    action: WalletAction | SuiteAction,
): Account[] =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return action.payload.accounts;
            case ACCOUNT.CREATE:
                create(draft, action.payload);
                break;
            case ACCOUNT.UPDATE:
                update(draft, action.payload);
                break;
            case ACCOUNT.CHANGE_VISIBILITY:
                update(draft, action.payload);
                break;
            case ACCOUNT.REMOVE:
                remove(draft, action.payload);
                break;
            case METADATA.ACCOUNT_LOADED:
            case METADATA.ACCOUNT_ADD:
                setMetadata(draft, action.payload);
                break;

            // no default
        }
    });

export default accountsReducer;
