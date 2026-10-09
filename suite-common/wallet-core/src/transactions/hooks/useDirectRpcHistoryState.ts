import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { type DirectRpcHistoryState, getDirectRpcHistoryState } from '@suite-common/wallet-utils';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';

/** What an empty transaction list means on a direct-RPC backend; undefined when nothing special. */
export const useDirectRpcHistoryState = (
    accountKey: AccountKey,
): DirectRpcHistoryState | undefined => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    return account ? getDirectRpcHistoryState(account) : undefined;
};
