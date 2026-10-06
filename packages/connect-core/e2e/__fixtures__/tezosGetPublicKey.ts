const legacyResults = [
    {
        // Not supported in T1B1.
        rules: ['1'],
        success: false,
    },
];

// m/44'/1729'/0' showOnTrezor: FW renders the edpk… form, the same value
// returned in `publicKey` / `displayablePublicKey`. deviceScreen is a stable
// prefix that fits inside the smallest-screen capture.
const showOnTrezorDisplayablePublicKey = 'edpkuxZ5W8c2jmcaGuCFZxRDSWxS7hp98zcwj2YpUZkJWs5F7UMuF6';
const showOnTrezorDeviceScreen = showOnTrezorDisplayablePublicKey.slice(0, 39);

const tezosGetPublicKey: TestCase = {
    method: 'tezosGetPublicKey',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: "m/44'/1729'/0'",
            params: {
                path: "m/44'/1729'/0'",
                showOnTrezor: false,
            },
            result: {
                publicKey: 'edpkuxZ5W8c2jmcaGuCFZxRDSWxS7hp98zcwj2YpUZkJWs5F7UMuF6',
                displayablePublicKey: 'edpkuxZ5W8c2jmcaGuCFZxRDSWxS7hp98zcwj2YpUZkJWs5F7UMuF6',
            },
        },
        {
            description: "m/44'/1729'/1'",
            params: {
                path: "m/44'/1729'/1'",
                showOnTrezor: false,
            },
            result: {
                publicKey: 'edpkuVKVFyqTnp4axajmxTnCcSHN7v1kRhVpBC25GEZQVT2ZzSpdJY',
                displayablePublicKey: 'edpkuVKVFyqTnp4axajmxTnCcSHN7v1kRhVpBC25GEZQVT2ZzSpdJY',
            },
        },
        {
            description: "m/44'/1729'",
            params: {
                path: "m/44'/1729'",
                showOnTrezor: false,
            },
            result: false,
        },
        {
            description: "m/44'/1729'/0",
            params: {
                path: "m/44'/1729'/0",
                showOnTrezor: false,
            },
            result: false,
        },
        {
            description: "m/44'/1729'/0' (showOnTrezor)",
            params: {
                path: "m/44'/1729'/0'",
                showOnTrezor: true,
            },
            result: {
                publicKey: showOnTrezorDisplayablePublicKey,
                displayablePublicKey: showOnTrezorDisplayablePublicKey,
            },
            deviceScreen: showOnTrezorDeviceScreen,
            deviceScreenSkip: ['1', '<2.7.0'],
        },
    ].map(fixture => ({ ...fixture, legacyResults })),
};

export default tezosGetPublicKey;
