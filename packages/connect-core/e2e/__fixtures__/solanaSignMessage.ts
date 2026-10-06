const legacyResults = [
    {
        // solanaSignMessage with OCMS v1 not supported below this version
        rules: ['<2.12.4', '1'],
        success: false,
    },
];

export default {
    method: 'solanaSignMessage',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/501'/0'/0' sign 'Hello, Trezor!'",
            params: {
                path: "m/44'/501'/0'/0'",
                message: 'Hello, Trezor!',
            },
            result: {
                signature:
                    'f2580d7f82bf2f9737925e7817d5b04cfe8b5e9b1f3c138517a9c55f2bb1f95524db937ec2a1dfebf67a1dc3ab27ef80629854ee2af5cb0ceb40568bc1bdb503',
                signedData:
                    'ff736f6c616e61206f6666636861696e010100d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad48656c6c6f2c205472657a6f7221',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0' sign 'Test message'",
            params: {
                path: "m/44'/501'/0'",
                message: 'Test message',
            },
            result: {
                signature:
                    '8b68c182627e84a0919372d809089e3a516de7ed90b1764aafdd995ef2fd39874929a5205d4e4eb360d260073e3316959571a5baf32a58f82bdbff83253abf06',
                signedData:
                    'ff736f6c616e61206f6666636861696e01013398f0abc4f8ec2f62435a78d8f4f3219b47b04f268798d2ed2260da0b4de45f54657374206d657373616765',
            },
            legacyResults,
        },
        {
            description: "m/44'/501'/0'/0' sign message with additional signer and chunkify",
            params: {
                path: "m/44'/501'/0'/0'",
                message:
                    'This is a longer test message that should be chunked across multiple display screens on the device',
                // The signing key must be among the signers; the second signer is an additional
                // co-signer embedded in the OCMS v1 envelope.
                signers: [
                    '14CCvQzQzHCVgZM3j9soPnXuJXh1RmCfwLVUcdfbZVBS',
                    '7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q',
                ],
                chunkify: true,
            },
            result: {
                signature:
                    '2dfa811d310f8eedcd945cbfcf3edd1abe319f051c3f9a111a75ee2280070a74b8635084fec9a5c629c65d752bc8223e735056f30764f8685c153160da2a1107',
                signedData:
                    'ff736f6c616e61206f6666636861696e010200d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad66c2f508c9c555cacc9fb26d88e88dd54e210bb5a8bce5687f60d7e75c4cd07f546869732069732061206c6f6e6765722074657374206d65737361676520746861742073686f756c64206265206368756e6b6564206163726f7373206d756c7469706c6520646973706c61792073637265656e73206f6e2074686520646576696365',
            },
            legacyResults,
        },
    ],
} satisfies TestCase;
