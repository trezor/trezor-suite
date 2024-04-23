const name = 'rebootToBootloader';

export default [
    {
        url: `/method/rebootToBootloader`,
        name,
        submitButton: 'Reboot to bootloader',
        fields: [
            {
                name: 'boot_command',
                label: 'boot_command',
                type: 'select',
                optional: false,
                value: 0,
                placeholder: 'Select',
                data: [
                    { value: 0, label: 'STOP_AND_WAIT' },
                    { value: 1, label: 'INSTALL_UPGRADE' },
                ],
            },
        ],
    },
];
