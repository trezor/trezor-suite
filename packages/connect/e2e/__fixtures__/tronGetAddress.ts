const legacyResults = [
    {
        rules: ['<2.11.0', '1'],
        success: false,
    },
];

export default {
    method: 'tronGetAddress',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/195'/0'/0/0",
            params: {
                path: "m/44'/195'/0'/0/0",
            },
            result: {
                address: 'TY72iA3SBtrds3QLYsS7LwYfkzXwAXCRWT',
            },
            legacyResults,
        },
        {
            description: "m/44'/195'/0'/0/1",
            params: {
                path: "m/44'/195'/0'/0/1",
            },
            result: {
                address: 'TFz2CJn9CJb8C4i1Gke3jmZX2fRMJxniH2',
            },
            legacyResults,
        },
    ],
} satisfies TestCase;
