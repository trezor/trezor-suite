import { MessagesSchema } from '@trezor/protobuf';

import { cardanoDerivationType } from './common';

const name = 'cardanoSignMessage';

const batch = [
    {
        name: 'path',
        type: 'input',
        value: "m/1852'/1815'/0'/0/0",
    },
    {
        name: 'payload',
        type: 'textarea',
        value: '48656c6c6f205472657a6f7221',
    },
    {
        name: 'preferHexDisplay',
        type: 'checkbox',
        value: false,
    },
    cardanoDerivationType,
];

export default [
    {
        name,
        submitButton: 'Sign message',

        fields: batch,
    },
    {
        name,
        submitButton: 'Sign message including address',

        fields: [
            ...batch,
            {
                name: 'protocolMagic',
                type: 'number',
                value: 764824073,
            },
            {
                name: 'networkId',
                type: 'number',
                value: 1,
            },
            {
                name: 'addressParameters',
                type: 'json',
                value: {
                    path: "m/1852'/1815'/0'/0/0",
                    stakingPath: "m/1852'/1815'/0'/2/0",
                    addressType: MessagesSchema.CardanoAddressType.BASE,
                },
            },
        ],
    },
];
