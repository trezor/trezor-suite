export default [
    {
        url: '/method/debugLinkGetState',
        name: 'debugLinkGetState',
        submitButton: 'Get state',

        fields: [],
    },
    {
        url: '/method/debugLinkDecision',
        name: 'debugLinkDecision',
        submitButton: 'Send decision',

        fields: [
            {
                name: 'yes_no',
                type: 'checkbox',
                value: true,
            },
            {
                name: 'up_down',
                type: 'checkbox',
                value: true,
            },
            {
                name: 'input',
                type: 'input-long',
                optional: true,
                value: '',
            },

        ],
    },
];