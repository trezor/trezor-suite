import produce from 'immer';
import { AccountInfo } from 'trezor-connect';
import { ACCOUNT } from '@wallet-actions/constants';
import { WalletAction, Network } from '@wallet-types';

type AccountNetworkSpecific =
    | {
          networkType: 'bitcoin';
          misc: undefined;
      }
    | {
          networkType: 'ripple';
          misc: { sequence: number; reserve: string };
          marker: NonNullable<AccountInfo['marker']>;
      }
    | {
          networkType: 'ethereum';
          misc: { nonce: string };
      };

export type Account = {
    deviceState: string;
    index: number;
    path: string;
    descriptor: string;
    accountType: NonNullable<Network['accountType']>;
    symbol: Network['symbol'];
    empty: boolean;
    visible: boolean;
    imported?: boolean;
    balance: string;
    availableBalance: string;
    tokens: AccountInfo['tokens'];
    addresses: AccountInfo['addresses'];
    utxo: AccountInfo['utxo'];
    history: AccountInfo['history'];
} & AccountNetworkSpecific;

const initialState: Account[] = [];

const create = (draft: Account[], account: Account) => {
    // TODO: check if account already exist, for example 2 device instances with same passphrase
    // remove "transactions" field, they are stored in "transactionReducer"
    if (account.history) {
        delete account.history.transactions;
    }
    draft.push(account);
};

const changeVisibility = (draft: Account[], account: Account) => {
    const index = draft.findIndex(
        a =>
            a.deviceState === account.deviceState &&
            a.symbol === account.symbol &&
            a.descriptor === account.descriptor,
    );
    if (draft[index]) {
        draft[index].visible = true;
    }
};

const remove = (draft: Account[], accounts: Account[]) => {
    accounts.forEach(a => {
        const index = draft.findIndex(
            ac =>
                ac.deviceState === a.deviceState &&
                ac.descriptor === a.descriptor &&
                ac.accountType === a.accountType &&
                ac.symbol === a.symbol,
        );
        draft.splice(index, 1);
    });
};

export default (state: Account[] = initialState, action: WalletAction): Account[] => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT.CREATE:
                create(draft, action.payload);
                break;
            case ACCOUNT.CHANGE_VISIBILITY:
                changeVisibility(draft, action.payload);
                break;
            case ACCOUNT.REMOVE:
                remove(draft, action.payload);
            // no default
        }
    });
};
