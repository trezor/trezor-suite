const name = 'changeWipeCode';
const docs = 'methods/changeWipeCode.md';

export default [
    {
        docs,
        url: '/method/changeWipeCode',
        name,
        submitButton: 'Change wipe code',
        fields: [
            {
                label: 'remove',
                name: 'remove',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
        ],
    },
];
