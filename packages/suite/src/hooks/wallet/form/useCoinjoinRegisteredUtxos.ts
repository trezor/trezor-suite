import { useMemo } from 'react';

import { selectRegisteredUtxosByAccountKey } from '@suite/coinjoin';
import { useSelector } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { type AccountUtxo } from '@trezor/connect';

interface UseCoinjoinRegisteredUtxosProps {
    account: Account;
}

// used in useUtxoSelection hook and UtxoSelection component (via UtxoSelectionContext)
// returns memoized AccountUtxo[] currently registered in coinjoin Round
export const useCoinjoinRegisteredUtxos = ({ account }: UseCoinjoinRegisteredUtxosProps) => {
    const sessionPrison = useSelector(state =>
        selectRegisteredUtxosByAccountKey(state, account.key),
    );

    const { utxo } = account;

    return useMemo(() => {
        const registeredUtxos: AccountUtxo[] = [];

        if (sessionPrison && Object.keys(sessionPrison).length > 0) {
            utxo?.forEach(accountUtxo => {
                if (sessionPrison?.[getUtxoOutpoint(accountUtxo)]) {
                    registeredUtxos.push(accountUtxo);
                }
            });
        }

        return registeredUtxos;
    }, [sessionPrison, utxo]);
};
