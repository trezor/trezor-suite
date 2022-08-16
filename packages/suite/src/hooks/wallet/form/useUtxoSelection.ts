import { useEffect } from 'react';
import { UseFormMethods } from 'react-hook-form';

import type { AccountUtxo } from '@trezor/connect';
import type { FormState } from '@wallet-types/sendForm';

type Props = UseFormMethods<{
    selectedUtxos?: FormState['selectedUtxos'];
}> & {
    composeRequest: (field?: string) => void;
};

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useUtxoSelection = ({ composeRequest, register, setValue, watch }: Props) => {
    // register custom form field (without HTMLElement)
    useEffect(() => {
        register({ name: 'selectedUtxos', type: 'custom' });
    }, [register]);

    const selectedUtxos = watch('selectedUtxos') || [];

    const toggleUtxoSelection = (utxo: AccountUtxo) => {
        const isSelected = selectedUtxos.find(u => u.txid === utxo.txid && u.vout === utxo.vout);
        setValue(
            'selectedUtxos',
            isSelected
                ? selectedUtxos.filter(u => u !== isSelected) ?? []
                : selectedUtxos.concat([utxo]),
        );
        composeRequest();
    };

    return {
        selectedUtxos,
        toggleUtxoSelection,
    };
};
