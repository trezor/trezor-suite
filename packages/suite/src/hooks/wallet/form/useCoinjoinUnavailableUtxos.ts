import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { AccountUtxo } from '@trezor/connect';

import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { Account } from '@suite-common/wallet-types';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { WabiSabiProtocolErrorCode } from 'src/types/wallet/coinjoin';
import {
    selectCoinjoinAccountByKey,
    selectCoinjoinClient,
} from 'src/reducers/wallet/coinjoinReducer';

interface UseCoinjoinUnavailableUtxosProps {
    account: Account;
    utxo: AccountUtxo;
}

// used in UtxoSelection component
// returns memoized message if AccountUtxo is not available for coinjoin
export const useCoinjoinUnavailableUtxos = ({
    account,
    utxo,
}: UseCoinjoinUnavailableUtxosProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, account.key));
    const coinjoinClient = useSelector(state => selectCoinjoinClient(state, account.key));

    const { translationString } = useTranslation();

    return useMemo(() => {
        if (!coinjoinClient?.allowedInputAmounts) return;

        const imprisonedUtxo = coinjoinAccount?.prison?.[getUtxoOutpoint(utxo)];
        if (imprisonedUtxo?.errorCode === WabiSabiProtocolErrorCode.InputBanned) {
            return translationString('TR_UTXO_SHORT_BANNED_IN_COINJOIN');
        }
        if (imprisonedUtxo?.errorCode === WabiSabiProtocolErrorCode.InputLongBanned) {
            return translationString('TR_UTXO_LONG_BANNED_IN_COINJOIN');
        }

        const amountBN = new BigNumber(utxo.amount);
        if (amountBN.lt(coinjoinClient.allowedInputAmounts.min)) {
            return translationString('TR_AMOUNT_TOO_SMALL_FOR_COINJOIN');
        }
        if (amountBN.gt(coinjoinClient.allowedInputAmounts.max)) {
            return translationString('TR_AMOUNT_TOO_BIG_FOR_COINJOIN');
        }
    }, [utxo, coinjoinAccount?.prison, coinjoinClient?.allowedInputAmounts, translationString]);
};
