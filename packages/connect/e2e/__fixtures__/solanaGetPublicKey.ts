const legacyResults = [
    {
        // Solana not supported below this version
        rules: ['<2.7.0', '1'], // TODO SOL: check version
        success: false,
    },
];

export default {
    method: 'solanaGetPublicKey',
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
                publicKey: '0ebf3b4a5e8efc65c508f1c813377a650f655814db3b23472bdcde5f2aeaa7a3',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0'",
            params: {
                path: "m/44'/501'/0'",
            },
            result: {
                publicKey: '3398f0abc4f8ec2f62435a78d8f4f3219b47b04f268798d2ed2260da0b4de45f',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0'/0'",
            params: {
                path: "m/44'/501'/0'/0'",
            },
            result: {
                publicKey: '00d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad',
            },
            legacyResults,
        },
    ],
};
