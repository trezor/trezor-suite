export default {
    method: 'telemetryGet',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Load telemetry data',
            params: {},
            result: {
                battery_cycles: 30000,
                battery_errors: 0,
                max_temp_c: 35000,
                min_temp_c: 20000,
            },
            legacyResults: [
                {
                    rules: ['<2.11.0', '*T3W1'],
                    success: false,
                },
            ],
        },
    ],
} satisfies TestCase;
