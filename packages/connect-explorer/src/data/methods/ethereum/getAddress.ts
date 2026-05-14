const name = 'ethereumGetAddress';

const getAddress = {
    name: 'path',
    type: 'input',
    value: `m/44'/60'/0'/0/0`,
};
const showOnTrezor = {
    name: 'showOnTrezor',
    type: 'checkbox',
    value: true,
};

const chunkify = {
    name: 'chunkify',
    type: 'checkbox',
    value: false,
};

const batch = [getAddress, showOnTrezor, chunkify];

export default [
    {
        name,
        submitButton: 'Get address',
        fields: batch,
    },
    {
        name,
        submitButton: 'Get address GoChain',
        fields: [{ ...getAddress, value: `m/44'/6060'/0'/0/0` }, showOnTrezor, chunkify],
    },
    {
        name,
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
