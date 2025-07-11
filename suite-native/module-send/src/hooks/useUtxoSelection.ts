import { useMemo } from 'react';

import { useAtom } from 'jotai';

import { Utxo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { selectedUtxosAtom } from '../atoms/coinControlAtoms';

type UseUtxoSelectionReturn = {
    totalSelectedAmount: BigNumber;
    isCoinControlEnabled: boolean;
    selectedUtxos: Utxo[];
    handleUtxoSelection: (utxo: Utxo) => void;
    setSelectedUtxos: (utxos: Utxo[]) => void;
};

export const useUtxoSelection = (accountKey: string): UseUtxoSelectionReturn => {
    const [selectedUtxosMap, setSelectedUtxosMap] = useAtom(selectedUtxosAtom);

    const selectedUtxos = useMemo(
        () => selectedUtxosMap[accountKey] || [],
        [selectedUtxosMap, accountKey],
    );

    const isCoinControlEnabled = useMemo(() => selectedUtxos.length > 0, [selectedUtxos]);
    const totalSelectedAmount = useMemo(
        () => selectedUtxos.reduce((acc, utxo) => BigNumber(acc).plus(utxo.amount), BigNumber(0)),
        [selectedUtxos],
    );

    const handleUtxoSelection = (utxo: Utxo) => {
        setSelectedUtxosMap(prev => {
            const isSelected = selectedUtxos.some(
                selected => selected.txid === utxo.txid && selected.vout === utxo.vout,
            );

            return {
                ...prev,
                [accountKey]: isSelected
                    ? selectedUtxos.filter(
                          selected => !(selected.txid === utxo.txid && selected.vout === utxo.vout),
                      )
                    : [...selectedUtxos, utxo],
            };
        });
    };

    const setSelectedUtxos = (utxos: Utxo[]) => {
        setSelectedUtxosMap(prev => ({
            ...prev,
            [accountKey]: utxos,
        }));
    };

    return {
        totalSelectedAmount,
        isCoinControlEnabled,
        selectedUtxos,
        handleUtxoSelection,
        setSelectedUtxos,
    };
};
