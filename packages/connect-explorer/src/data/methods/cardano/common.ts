import {
    CardanoNativeScriptHashDisplayFormat,
    CardanoTxSigningMode,
} from '@trezor/protobuf/lib/messages-schema';

export const cardanoDerivationType = {
    name: 'derivationType',
    type: 'select',
    value: 2,
    data: [
        { value: 0, label: 'Ledger' },
        { value: 1, label: 'Icarus' },
        { value: 2, label: 'Icarus_Trezor' },
    ],
};

export const cardanoNativeScriptHashDisplayFormat = {
    name: 'displayFormat',
    type: 'select',
    value: CardanoNativeScriptHashDisplayFormat.POLICY_ID,
    data: Object.keys(CardanoNativeScriptHashDisplayFormat).map(key => ({
        value: CardanoNativeScriptHashDisplayFormat[key],
        label: key,
    })),
};

export const cardanoTxSigningMode = {
    name: 'signingMode',
    type: 'select',
    value: CardanoTxSigningMode.ORDINARY_TRANSACTION,
    data: Object.keys(CardanoTxSigningMode).map(key => ({
        value: CardanoTxSigningMode[key],
        label: key,
    })),
};
