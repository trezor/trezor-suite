import { CardanoAddressType } from 'trezor-connect';

const name = 'cardanoGetAddress';
const docs = 'methods/cardanoGetAddress.md';

// todo: import from trezor-connect
enum CardanoDerivationType {
    LEDGER = 0,
    ICARUS = 1,
    ICARUS_TREZOR = 2,
}

// const addressParameters = [
//     {
//         name: 'path',
//         label: 'path',
//         type: 'input',
//         value: "m/1852'/1815'/0'/0/0",
//     },
//     {
//         name: 'stakingPath',
//         label: 'staking path',
//         type: 'input',
//         value: "m/1852'/1815'/0'/2/0",
//     },
//     {
//         name: 'addressType',
//         label: 'address type',
//         value: ''
//     }
// ];

const batch = [
    {
        name: 'addressParameters',
        type: 'json',
        value: `{'path': "m/1852'/1815'/0'/0/0", 'stakingPath': "m/1852'/1815'/0'/2/0", 'addressType': ${CardanoAddressType.BASE} }`,
    },
    {
        name: 'networkId',
        label: 'Network id',
        type: 'number',
        value: 1,
    },
    {
        name: 'protocolMagic',
        label: 'Network id',
        type: 'number',
        value: 764824073,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        defaultValue: true,
        value: true,
    },
    {
        name: 'derivation_type',
        label: 'Derivation type',
        type: 'number',
        value: CardanoDerivationType.ICARUS_TREZOR,
    },
];

export default [
    {
        url: '/method/cardanoGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    // {
    //     url: '/method/cardanoGetAddress-multiple',
    //     name,
    //     docs,
    //     submitButton: 'Get multiple addresses',

    //     fields: [
    //         {
    //             name: 'bundle',
    //             type: 'array',
    //             batch: [
    //                 {
    //                     type: 'doesnt-matter',
    //                     fields: batch,
    //                 },
    //             ],
    //             items: [batch, batch],
    //         },
    //     ],
    // },

    // {
    //     url: '/method/cardanoGetAddress-validation',
    //     name,
    //     docs,
    //     submitButton: 'Validate address',

    //     fields: [
    //         {
    //             name: 'path',
    //             label: 'Bip44 path',
    //             type: 'input',
    //             value: `m/44'/1815'/0'/0/0`,
    //         },
    //         {
    //             name: 'address',
    //             type: 'address',
    //             value: 'Ae2tdPwUPEZ5YUb8sM3eS8JqKgrRLzhiu71crfuH2MFtqaYr5ACNRdsswsZ',
    //         },
    //     ],
    // },
];
