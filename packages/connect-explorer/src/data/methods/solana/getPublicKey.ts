const name = 'solanaGetPublicKey';

const getAddress = {
    name: 'path',
    type: 'input',
    value: `m/44'/501'/0'/0'`,
};

const showOnTrezor = {
    name: 'showOnTrezor',
    type: 'checkbox',
    value: true,
};

const batch = [getAddress, showOnTrezor];

export default [
    {
        name,
        submitButton: 'Get public key',
        fields: batch,
    },
    {
        name,
        submitButton: 'Get multiple public keys',

        fields: [
            {
                name: 'bundle',
                type: 'array',
                batch: [
                    {
                        type: '',
                        fields: batch,
                    },
                ],
                items: [batch, batch],
            },
        ],
    },
];
