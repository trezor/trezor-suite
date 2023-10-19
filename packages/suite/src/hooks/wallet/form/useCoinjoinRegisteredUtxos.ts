import { useMemo } from 'react';
import { AccountUtxo } from '@trezor/connect';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { selectRegisteredUtxosByAccountKey } from 'src/reducers/wallet/coinjoinReducer';

interface UseCoinjoinRegisteredUtxosProps {
    account: Account;
}

// used in useUtxoSelection hook and UtxoSelection component (via UtxoSelectionContext)
// returns memoized AccountUtxo[] currently registered in coinjoin Round
export const useCoinjoinRegisteredUtxos = ({ account }: UseCoinjoinRegisteredUtxosProps) => {
    const sessionPrison = useSelector(state =>
        selectRegisteredUtxosByAccountKey(state, account.key),
    );

    return useMemo(() => {
        const registeredUtxos: AccountUtxo[] = [];

        if (sessionPrison && Object.keys(sessionPrison).length > 0) {
            account?.utxo?.forEach(utxo => {
                if (sessionPrison?.[getUtxoOutpoint(utxo)]) {
                    registeredUtxos.push(utxo);
                }
            });
        }

        return registeredUtxos;
    }, [sessionPrison, account?.utxo]);
};
