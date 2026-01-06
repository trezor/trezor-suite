const name = 'tronGetAddress';
const docs = 'methods/tronGetAddress.md';

const getAddress = {
    name: 'path',
    label: 'Bip44 path',
    type: 'input',
    value: `m/44'/195'/0'/0/0`,
};
const showOnTrezor = {
    name: 'showOnTrezor',
    label: 'Show on Trezor',
    type: 'checkbox',
    value: true,
};

const chunkify = {
    name: 'chunkify',
    label: 'Display address in chunks of 4 characters',
    type: 'checkbox',
    value: false,
};

const batch = [getAddress, showOnTrezor, chunkify];

export default [
    {
        url: '/method/tronGetAddress',
        name,
        docs,
        submitButton: 'Get address',
        fields: batch,
    },
];
