import { CardanoAddressType } from '@trezor/protobuf/lib/messages-schema';
import { cardanoDerivationType } from './common';

const name = 'cardanoSignMessage';
const docs = 'methods/cardanoSignMessage.md';

const batch = [
    {
        name: 'signingPath',
        label: 'Bip44 path',
        type: 'input',
        value: "m/1852'/1815'/0'/0/0",
    },
    {
        name: 'payload',
        label: 'Payload hex string',
        type: 'textarea',
        value: '48656c6c6f205472657a6f7221',
    },
    {
        name: 'hashPayload',
        label: 'Hash payload',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'displayAscii',
        label: 'Display payload as ASCII on Trezor',
        type: 'checkbox',
        value: false,
    },
    cardanoDerivationType,
];

export default [
    {
        url: '/method/cardanoSignMessage',
        name,
        docs,
        submitButton: 'Sign message',

        fields: batch,
    },
    {
        url: '/method/cardanoSignMessage-addressParameters',
        name,
        docs,
        submitButton: 'Sign message including address',

        fields: [
            ...batch,
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
                name: 'addressParameters',
                type: 'json',
                value: {
                    path: "m/1852'/1815'/0'/0/0",
                    stakingPath: "m/1852'/1815'/0'/2/0",
                    addressType: CardanoAddressType.BASE,
                },
            },
        ],
    },
];
