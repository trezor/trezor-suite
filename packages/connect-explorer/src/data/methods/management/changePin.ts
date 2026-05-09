const name = 'changePin';

export default [
    {
        name,
        submitButton: 'Change PIN',
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
