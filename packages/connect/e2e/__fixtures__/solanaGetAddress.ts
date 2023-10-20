const legacyResults = [
    {
        // Solana not supported below this version
        rules: ['<2.7.0', '1'], // TODO SOL: check version
        success: false,
    },
];

export default {
    method: 'solanaGetAddress',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/501'",
            params: {
                path: "m/44'/501'",
            },
            result: {
                address: 'zZqNUDNijfbMXFy2wVCdJSm9MeMfxBMdxBqseSuiSW6',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0'",
            params: {
                path: "m/44'/501'/0'",
            },
            result: {
                address: '4UR47Kp4FxGJiJZZGSPAzXqRgMmZ27oVfGhHoLmcHakE',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0'/0'",
            params: {
                path: "m/44'/501'/0'/0'",
            },
            result: {
                address: '14CCvQzQzHCVgZM3j9soPnXuJXh1RmCfwLVUcdfbZVBS',
            },
            legacyResults,
        },
    ],
};
