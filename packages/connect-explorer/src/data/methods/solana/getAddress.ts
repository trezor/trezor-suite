const name = 'solanaGetAddress';

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
];
