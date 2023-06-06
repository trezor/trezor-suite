const name = 'ethereumGetAddress';
const docs = 'methods/ethereumGetAddress.md';

const getAddress = {
    name: 'path',
    label: 'Bip44 path',
    type: 'input',
    value: `m/44'/60'/0'/0/0`,
};
const showOnTrezor = {
    name: 'showOnTrezor',
    label: 'Show on Trezor',
    type: 'checkbox',
    value: true,
};

const batch = [getAddress, showOnTrezor];

export default [
    {
        url: '/method/ethereumGetAddress',
        name,
        docs,
        submitButton: 'Get address',
        fields: batch,
    },
    {
        url: '/method/ethereumGetAddress-gochain',
        name,
        docs,
        submitButton: 'Get address GoChain',
        fields: [{ ...getAddress, value: `m/44'/6060'/0'/0/0` }, showOnTrezor],
    },
    {
        url: '/method/ethereumGetAddress-multiple',
        name,
        docs,
        submitButton: 'Get multiple addresses',

        fields: [
            {
                name: 'bundle',
                type: 'array',
                batch: [
                    {
                        type: 'doesnt-matter',
                        fields: batch,
                    },
                ],
                items: [batch, batch],
            },
        ],
    },
];
