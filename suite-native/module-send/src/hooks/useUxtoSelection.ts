import { useMemo } from 'react';

import { useAtom } from 'jotai';

import { Utxo } from '@trezor/blockchain-link-types';

import { selectedUtxosAtom } from '../atoms/coinControlAtoms';

type UseUtxoSelectionReturn = {
    totalSelectedAmount: string;
    isCoinControlEnabled: boolean;
    selectedUtxos: Utxo[];
    handleUtxoSelection: (utxo: Utxo) => void;
    setSelectedUtxos: (utxos: Utxo[]) => void;
};

export const useUtxoSelection = (): UseUtxoSelectionReturn => {
    const [selectedUtxos, setSelectedUtxos] = useAtom(selectedUtxosAtom);

    const isCoinControlEnabled = useMemo(() => selectedUtxos.length > 0, [selectedUtxos]);
    const totalSelectedAmount = useMemo(
        () => selectedUtxos.reduce((acc, utxo) => acc + Number(utxo.amount), 0).toString(),
        [selectedUtxos],
    );

    const handleUtxoSelection = (utxo: Utxo) => {
        setSelectedUtxos(prev =>
            prev.some(selected => selected.address === utxo.address)
                ? prev.filter(selected => selected.address !== utxo.address)
                : [...prev, utxo],
        );
    };

    return {
        totalSelectedAmount,
        isCoinControlEnabled,
        selectedUtxos,
        handleUtxoSelection,
        setSelectedUtxos,
    };
};
