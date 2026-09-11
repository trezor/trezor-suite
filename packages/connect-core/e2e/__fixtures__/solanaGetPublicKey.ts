const legacyResults = [
    {
        // Solana not supported below this version
        // TODO solana (vl/connect): set proper version
        rules: ['<2.7.0', '1'],
        success: false,
    },
];

// m/44'/501'/0' showOnTrezor: FW renders the base58 form returned in
// `publicKeyBase58` / `displayablePublicKey`. deviceScreen is a stable prefix
// that fits inside the smallest-screen capture.
const showOnTrezorDisplayablePublicKey = '4UR47Kp4FxGJiJZZGSPAzXqRgMmZ27oVfGhHoLmcHakE';
const showOnTrezorDeviceScreen = showOnTrezorDisplayablePublicKey.slice(0, 34);

const solanaGetPublicKey: TestCase = {
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
                publicKeyBase58: 'zZqNUDNijfbMXFy2wVCdJSm9MeMfxBMdxBqseSuiSW6',
                displayablePublicKey: 'zZqNUDNijfbMXFy2wVCdJSm9MeMfxBMdxBqseSuiSW6',
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
                publicKeyBase58: '4UR47Kp4FxGJiJZZGSPAzXqRgMmZ27oVfGhHoLmcHakE',
                displayablePublicKey: '4UR47Kp4FxGJiJZZGSPAzXqRgMmZ27oVfGhHoLmcHakE',
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
                publicKeyBase58: '14CCvQzQzHCVgZM3j9soPnXuJXh1RmCfwLVUcdfbZVBS',
                displayablePublicKey: '14CCvQzQzHCVgZM3j9soPnXuJXh1RmCfwLVUcdfbZVBS',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0' (showOnTrezor)",
            params: {
                path: "m/44'/501'/0'",
                showOnTrezor: true,
            },
            result: {
                publicKey: '3398f0abc4f8ec2f62435a78d8f4f3219b47b04f268798d2ed2260da0b4de45f',
                publicKeyBase58: showOnTrezorDisplayablePublicKey,
                displayablePublicKey: showOnTrezorDisplayablePublicKey,
            },
            deviceScreen: showOnTrezorDeviceScreen,
            deviceScreenSkip: ['1', '<2.7.0'],
            legacyResults,
        },
    ],
};

export default solanaGetPublicKey;
