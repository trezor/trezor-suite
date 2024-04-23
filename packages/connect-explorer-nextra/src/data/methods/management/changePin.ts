const name = 'changePin';
const docs = 'methods/changePin.md';

export default [
    {
        docs,
        url: '/method/changePin',
        name,
        submitButton: 'Change PIN',
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
