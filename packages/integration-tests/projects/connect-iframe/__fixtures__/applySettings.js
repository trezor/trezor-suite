export default {
    method: 'applySettings',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Change label, rotation and passphrase',
            params: {
                label: 'cool label',
                display_rotation: 90,
                use_passphrase: false,
            },
            result: {
                message: 'Settings applied',
            },
        },
        {
            description: 'Change auto_lock_delay',
            params: {
                auto_lock_delay_ms: 60 * 1000,
                display_rotation: 0,
            },
            result: {
                message: 'Settings applied',
            },
        },
    ],
};
