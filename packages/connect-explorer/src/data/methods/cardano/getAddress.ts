import { CardanoAddressType } from '@trezor/transport/lib/types/messages';

import { cardanoDerivationType } from './common';

const name = 'cardanoGetAddress';
const docs = 'methods/cardanoGetAddress.md';

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
        value: true,
    },
    cardanoDerivationType,
];

export default [
    {
        url: '/method/cardanoGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },
];
