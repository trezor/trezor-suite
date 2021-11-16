import { CardanoTxSigningMode } from 'trezor-connect';

// todo: import from trezor-connect
enum CardanoDerivationType {
    LEDGER = 0,
    ICARUS = 1,
    ICARUS_TREZOR = 2,
}

const name = 'cardanoSignTransaction';
const docs = 'methods/cardanoSignTransaction.md';

// todo: taken from connect tests. make it sharable
const SAMPLE_INPUTS = {
    byron_input: {
        path: "m/44'/1815'/0'/0/1",
        prev_hash: '1af8fa0b754ff99253d983894e63a2b09cbb56c833ba18c3384210163f63dcfc',
        prev_index: 0,
    },
    shelley_input: {
        path: "m/1852'/1815'/0'/0/0",
        prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        prev_index: 0,
    },
    external_input: {
        path: undefined,
        prev_hash: '3b40265111d8bb3c3c608d95b3a0bf83461ace32d79336579a1939b3aad1c0b7',
        prev_index: 0,
    },
};

const SAMPLE_OUTPUTS = {
    simple_byron_output: {
        address: 'Ae2tdPwUPEZCanmBz5g2GEwFqKTKpNJcGYPKfDxoNeKZ8bRHr8366kseiK2',
        amount: '3003112',
    },
};

const tx = {
    inputs: [SAMPLE_INPUTS.byron_input],
    outputs: [SAMPLE_OUTPUTS.simple_byron_output],
};

export default [
    {
        url: '/method/cardanoSignTransaction',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'protocolMagic',
                label: 'Protocol magic',
                type: 'number',
                value: 764824073,
            },
            {
                name: 'networkId',
                label: 'Network id',
                type: 'number',
                value: 1,
            },
            {
                name: 'inputs',
                type: 'json',
                value: JSON.stringify(tx.inputs),
            },
            {
                name: 'outputs',
                type: 'json',
                value: JSON.stringify(tx.outputs),
            },
            {
                name: 'signingMode',
                type: 'number',
                value: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            },
            {
                name: 'fee',
                type: 'input',
                value: '42',
            },
            {
                name: 'derivation_type',
                label: 'Derivation type',
                type: 'number',
                value: CardanoDerivationType.ICARUS_TREZOR,
            },
        ],
    },
];
