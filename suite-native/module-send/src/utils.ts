import { FormState, TokenAddress } from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';

import { SendOutputFieldName, SendOutputsFormValues } from './sendOutputsFormSchema';

export const getOutputFieldName = <TField extends SendOutputFieldName>(
    index: number,
    field: TField,
): `outputs.${number}.${TField}` => `outputs.${index}.${field}`;

export const constructFormDraft = ({
    formValues: { outputs, setMaxOutputId },
    tokenContract,
    feeLevel = { label: 'normal', feePerUnit: '' },
}: {
    formValues: SendOutputsFormValues;
    tokenContract?: TokenAddress;
    feeLevel?: Pick<FeeLevel, 'label' | 'feePerUnit' | 'feeLimit'>;
}): FormState => ({
    outputs: outputs.map(({ address, amount, fiat = '' }) => ({
        address,
        amount,
        type: 'payment',
        token: tokenContract ?? null,
        fiat,
        currency: { label: '', value: '' },
    })),
    setMaxOutputId,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    options: [],
    selectedFee: feeLevel.label,
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: feeLevel.feeLimit ?? '',
});
