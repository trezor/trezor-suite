import {
    CardanoNativeScriptHashDisplayFormat,
    CardanoTxSigningMode,
} from '@trezor/protobuf/src/messages-schema';

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
    data: Object.entries(CardanoNativeScriptHashDisplayFormat).map(([key, value]) => ({
        value,
        label: key,
    })),
};

export const cardanoTxSigningMode = {
    name: 'signingMode',
    type: 'select',
    value: CardanoTxSigningMode.ORDINARY_TRANSACTION,
    data: Object.entries(CardanoTxSigningMode).map(([key, value]) => ({
        value,
        label: key,
    })),
};
