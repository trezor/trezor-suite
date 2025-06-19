import { useEffect, useState } from 'react';

import { useAtom, useSetAtom } from 'jotai';

import { Utxo } from '@trezor/blockchain-link-types';

import { coinControlEnabledAtom } from '../atoms/coinControlAtoms';

export const useUtxoSelection = () => {
    const [isCoinControlEnabled] = useAtom(coinControlEnabledAtom);
    const setCoinControlEnabled = useSetAtom(coinControlEnabledAtom);

    const [selectedUtxos, setSelectedUtxos] = useState<Utxo[]>([]);
    const [totalAmount, setTotalAmount] = useState('0');

    const toggleCoinControl = () => {
        setCoinControlEnabled(prev => !prev);
    };

    // TODO

    const handleUtxoSelection = (utxo: Utxo) => {
        setSelectedUtxos(prev => {
            const isSelected = prev.some(selected => selected.address === utxo.address);
            let newSelected;

            if (isSelected) {
                newSelected = prev.filter(selected => !(selected.address === utxo.address));
            } else {
                newSelected = [...prev, utxo];
            }

            return newSelected;
        });
    };

    useEffect(() => {
        const total = selectedUtxos.reduce((acc, utxo) => acc + BigInt(utxo.amount), BigInt(0));
        setTotalAmount(total.toString());
    }, [selectedUtxos]);

    return {
        totalSelectedAmount: totalAmount,
        isCoinControlEnabled,
        selectedUtxos,
        toggleCoinControl,
        handleUtxoSelection,
    };
};
