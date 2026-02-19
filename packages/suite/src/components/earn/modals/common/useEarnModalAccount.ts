import { useEffect } from 'react';

import { EarnAccountRef } from '@suite-common/suite-types/src/staking';
import { getNetwork } from '@suite-common/wallet-config';
import { accountsActions, selectAccounts } from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectFullSelectedAccount,
    selectSelectedAccount,
} from 'src/reducers/wallet/selectedAccountReducer';

type UseEarnModalAccountProps = {
    account?: EarnAccountRef;
    shouldSyncSelectedAccount?: boolean;
};

export const useEarnModalAccount = ({
    account,
    shouldSyncSelectedAccount = false,
}: UseEarnModalAccountProps) => {
    const dispatch = useDispatch();
    const selectedAccount = useSelector(selectSelectedAccount);
    const selectedAccountState = useSelector(selectFullSelectedAccount);
    const accountByRef = useSelector(state => {
        if (!account) {
            return undefined;
        }

        return selectAccounts(state).find(
            candidate =>
                candidate.descriptor === account.descriptor &&
                candidate.symbol === account.symbol &&
                candidate.deviceState === account.deviceStaticSessionId,
        );
    });

    useEffect(() => {
        if (!shouldSyncSelectedAccount || !accountByRef) {
            return;
        }

        if (
            selectedAccountState.status === 'loaded' &&
            selectedAccountState.account.key === accountByRef.key
        ) {
            return;
        }

        dispatch(
            accountsActions.updateSelectedAccount({
                status: 'loaded',
                account: accountByRef,
                network: getNetwork(accountByRef.symbol),
                params: {
                    symbol: accountByRef.symbol,
                    accountIndex: accountByRef.index,
                    accountType: accountByRef.accountType,
                },
            }),
        );
    }, [accountByRef, dispatch, selectedAccountState, shouldSyncSelectedAccount]);

    return accountByRef ?? selectedAccount;
};
