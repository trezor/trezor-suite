import { FormState, TokenAddress } from '@suite-common/wallet-types';

import { SendOutputFieldName, SendOutputsFormValues } from './sendOutputsFormSchema';

export const getOutputFieldName = <TField extends SendOutputFieldName>(
    index: number,
    field: TField,
): `outputs.${number}.${TField}` => `outputs.${index}.${field}`;

export const constructFormDraft = ({
    formValues: { outputs, setMaxOutputId },
    tokenContract,
}: {
    formValues: SendOutputsFormValues;
    tokenContract?: TokenAddress;
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
    feeLimit: '',
    feePerUnit: '',
    options: [],
    selectedFee: 'normal',
});
