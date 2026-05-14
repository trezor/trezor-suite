const name = 'changeWipeCode';

export default [
    {
        name,
        submitButton: 'Change wipe code',
        fields: [
            {
                name: 'remove',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
        ],
    },
];
