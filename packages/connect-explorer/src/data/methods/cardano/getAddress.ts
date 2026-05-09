import { MessagesSchema } from '@trezor/protobuf';

import { cardanoDerivationType } from './common';

const name = 'cardanoGetAddress';

const batch = [
    {
        name: 'addressParameters',
        type: 'json',
        value: {
            path: "m/1852'/1815'/0'/0/0",
            stakingPath: "m/1852'/1815'/0'/2/0",
            addressType: MessagesSchema.CardanoAddressType.BASE,
        },
    },
    {
        name: 'networkId',
        type: 'number',
        value: 1,
    },
    {
        name: 'protocolMagic',
        type: 'number',
        value: 764824073,
    },
    {
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'chunkify',
        type: 'checkbox',
        value: false,
    },
    cardanoDerivationType,
];

export default [
    {
        name,
        submitButton: 'Get address',

        fields: batch,
    },
];
