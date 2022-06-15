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

export const useUtxoSelection = ({ composeRequest, setValue, getValues, register }: Props) => {
    // register custom form field (without HTMLElement)
    useEffect(() => {
        register({ name: 'selectedUtxos', type: 'custom' });
    }, [register]);

    const toggleUtxoSelection = (utxo: AccountUtxo) => {
        const { selectedUtxos } = getValues();
        const isSelected = selectedUtxos?.find(u => u.txid === utxo.txid && u.vout === utxo.vout);
        if (isSelected) {
            setValue('selectedUtxos', selectedUtxos?.filter(u => u !== isSelected) ?? []);
        } else {
            setValue('selectedUtxos', (selectedUtxos || []).concat([utxo]));
        }
        composeRequest();
    };

    return {
        toggleUtxoSelection,
    };
};
