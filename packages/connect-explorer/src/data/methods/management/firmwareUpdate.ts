const name = 'firmwareUpdate';

export default [
    {
        url: `/method/firmwareUpdate`,
        name,
        submitButton: 'Firmware update',
        fields: [
            {
                name: 'payload',
                label: 'payload',
                optional: false,
                type: 'file',
            },
        ],
    },
];
