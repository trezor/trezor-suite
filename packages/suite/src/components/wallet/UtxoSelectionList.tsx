import * as React from 'react';

import { getAccountTransactions } from '@suite-common/wallet-utils';
import { useSelector } from '@suite-hooks';
import type { AccountUtxo, CardanoInput, PROTO } from '@trezor/connect';
import { UtxoSelection } from '@wallet-components/UtxoSelection';
import { useSendFormContext } from '@wallet-hooks';

interface Props {
    composedInputs: PROTO.TxInputType[] | CardanoInput[];
    utxos: AccountUtxo[];
}

export const UtxoSelectionList = ({ composedInputs, utxos }: Props) => {
    const { transactions } = useSelector(state => ({
        transactions: state.wallet.transactions,
    }));

    const { account, selectedUtxos } = useSendFormContext();

    const accountTransactions = getAccountTransactions(account.key, transactions.transactions);

    const isChecked = (utxo: AccountUtxo) =>
        isCoinControlEnabled
            ? selectedUtxos.some(u => u.txid === utxo.txid && u.vout === utxo.vout)
            : composedInputs.some(u => u.prev_hash === utxo.txid && u.prev_index === utxo.vout);

    return (
        <>
            {utxos.map(utxo => (
                <UtxoSelection
                    key={`${utxo.txid}-${utxo.vout}`}
                    isChecked={isChecked(utxo)}
                    transaction={accountTransactions.find(
                        transaction => transaction?.txid === utxo.txid,
                    )}
                    utxo={utxo}
                />
            ))}
        </>
    );
};
