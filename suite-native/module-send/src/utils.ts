import { FormState, TokenAddress } from '@suite-common/wallet-types';
import { Utxo } from '@trezor/blockchain-link-types';
import { FeeLevel } from '@trezor/connect';

import { SendOutputFieldName, SendOutputsFormValues } from './sendOutputsFormSchema';

export const getOutputFieldName = <TField extends SendOutputFieldName>(
    index: number,
    field: TField,
): `outputs.${number}.${TField}` => `outputs.${index}.${field}`;

export const constructFormDraft = ({
    formValues: { outputs, ...restFormValues },
    tokenContract,
    feeLevel = { label: 'normal', feePerUnit: '' },
    selectedUtxos = [],
}: {
    formValues: SendOutputsFormValues;
    tokenContract?: TokenAddress;
    feeLevel?: Pick<FeeLevel, 'label' | 'feePerUnit' | 'feeLimit'>;
    selectedUtxos?: Utxo[];
}): FormState => ({
    outputs: outputs.map(({ address, amount, fiat = '' }) => ({
        address,
        amount,
        type: 'payment',
        token: tokenContract ?? null,
        fiat,
        currency: { label: '', value: '' },
    })),
    isCoinControlEnabled: selectedUtxos.length > 0,
    hasCoinControlBeenOpened: false,
    selectedUtxos,
    options: [],
    selectedFee: feeLevel.label,
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: feeLevel.feeLimit ?? '',
    ...restFormValues,
});

export const isSameUtxo = (utxo1: Utxo, utxo2: Utxo): boolean =>
    utxo1.txid === utxo2.txid && utxo1.vout === utxo2.vout;
