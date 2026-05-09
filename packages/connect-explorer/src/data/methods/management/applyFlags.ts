const name = 'applyFlags';

export default [
    {
        name,
        submitButton: 'Apply flags',
        fields: [
            {
                name: 'flags',
                type: 'number',
                optional: false,
                value: '',
            },
        ],
    },
];
