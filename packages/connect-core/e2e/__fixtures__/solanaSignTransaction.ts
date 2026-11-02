const legacyResults = [
    {
        // Solana not supported below this version
        // TODO solana (vl/connect): set proper version
        rules: ['<2.7.0', '1'],
        success: false,
    },
];

const v1LegacyResults = [
    {
        // Solana v1 transactions not supported below this version
        rules: ['<2.13.1', '1'],
        success: false,
    },
];

// Messages and signatures from the firmware fixtures in sign_tx.v1_transactions.json.
const v1TransferTx =
    '81010001000000001aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d010300d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88adc80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6000000000000000000000000000000000000000000000000000000000000000002020c00000102000000400d030000000000';
const v1TransferSignature =
    'b51fe97a35dd9b13d661178b0f19f0de886cf4e87b638d831244881da1f3aba5e8a01537545dae3108a4b4e6f985f6b07916583a017d3a81bd883dc737351003';

const solanaSignTransaction: TestCase = {
    method: 'solanaSignTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Create stake account',
            params: {
                path: "m/44'/501'/0'/0'",
                serializedTx:
                    '0200030500d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad8c72b471e11674bdcd1e5f85421be42097d5d9c8642172ab73ccf6ff003a43f3000000000000000000000000000000000000000000000000000000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a000000001aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d02020200013400000000002d310100000000e80300000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000003020104740000000000d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad00d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            },
            result: {
                signature:
                    'e99a383ce8f9fcd0ebbb03fce2c47db188734bd36613d226110dfa9d95ba28ad55c4e3ff36d1c4936538350d96d7aeff024c3e6afbb5c45dfe921a18e981ea0c',
            },
            legacyResults,
        },
        {
            description: 'v0 transaction with lookup tables',
            params: {
                path: "m/44'/501'/0'/0'",
                serializedTx:
                    '800100010200d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad00000000000000000000000000000000000000000000000000000000000000001aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d03010200020c02000000002d310100000000010200030c0200000080c3c90100000000010200040c02000000005a620200000000028f41927b2e58cbc31ed3aa5163a7b8ca4eb5590e8dc1dc682426cd2895aa9c0a02000100ef99897471dc2c4ee3edf20fb2b5adef45bd426ed7de0c55bc5c3b6dbcd53092010000',
            },
            result: {
                signature:
                    '18cfc28c0119e9045b3ead4e82cfee79450ecda7e18835d0461278c1df0e6dee4c75ad01fab32c3d395390703fc755e68f8de1832e8b3f8503c0fbc82359af0b',
            },
            legacyResults,
        },
        {
            description: 'v1 transaction',
            params: {
                path: "m/44'/501'/0'/0'",
                serializedTx: v1TransferTx,
            },
            result: {
                signature: v1TransferSignature,
            },
            legacyResults: v1LegacyResults,
        },
        {
            description: 'v1 transaction with config',
            params: {
                path: "m/44'/501'/0'/0'",
                serializedTx:
                    '810100011f0000001aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d010300d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88adc80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c600000000000000000000000000000000000000000000000000000000000000004006000000000000400d0300000001000000010002020c00000102000000002d310100000000',
            },
            result: {
                signature:
                    '0164337e487bcf07f80eb6db935a28d4d241a6a06d989d0f57412f67cacc525eb3e3277cac88f6126e40bb37041f631ae5cdaebab1194f7c765b1ee3bd6d9907',
            },
            legacyResults: v1LegacyResults,
        },
        {
            description: 'v1 transaction serialized with signatures after the message',
            params: {
                path: "m/44'/501'/0'/0'",
                serializedTx: `${v1TransferTx}${'00'.repeat(64)}`,
                serialize: true,
            },
            result: {
                signature: v1TransferSignature,
                serializedTx: `${v1TransferTx}${v1TransferSignature}`,
            },
            legacyResults: v1LegacyResults,
        },
    ],
};

export default solanaSignTransaction;
