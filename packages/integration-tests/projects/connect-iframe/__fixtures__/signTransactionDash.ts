const { ADDRESS_N, TX_CACHE } = global.TestUtils;

// vectors from https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/test_msg_signtx_dash.py

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // See https://dash1.trezor.io/tx/be1af4a0e1eaccf86767836b42ee0938cceba16d0dd6c283f476db692c961f41
            description: 'Dash: 1 input, 1 output, no change',
            params: {
                coin: 'Dash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/5'/0'/0/0"),
                        prev_hash:
                            '24522992fb42f85d2d43efa3a1ddb98de23ed28583e19128e6e200a9fa6bc665',
                        prev_index: 1,
                        amount: '1000000',
                    },
                ],
                outputs: [
                    {
                        address: 'XnD5rf5CsAo68wr2h9Nod58whcxX94VvqQ',
                        amount: '998060',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['245229']),
            },
            result: {
                serializedTx:
                    '010000000165c66bfaa900e2e62891e18385d23ee28db9dda1a3ef432d5df842fb92295224010000006a473044022061db2e7970f5cc6a8bbd1547103f28558e36177862e8fc13ea5b69dd199b52560220277451bb5ce650a95e5f67019ca0ddaa1fef221310c52bd1919e54a5caae5b4b012102936f80cac2ba719ddb238646eb6b78a170a55a52a9b9f08c43523a4a6bd5c896ffffffff01ac3a0f00000000001976a9147e6191bd0404cb41ed67e041bd674e2a5c9d280188ac00000000',
            },
        },
        {
            description: 'Dash: dip2 input',
            params: {
                coin: 'Dash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/5'/0'/0/0"),
                        prev_hash:
                            '15575a1c874bd60a819884e116c42e6791c8283ce1fc3b79f0d18531a61bbb8a',
                        prev_index: 1,
                        amount: '4095000260',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/5'/0'/1/0"),
                        amount: '4000000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'XrEFMNkxeipYHgEQKiJuqch8XzwrtfH5fm',
                        amount: '95000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['15575a'], true), // NOTE: this tx doesn't exist in main network
            },
            result: {
                serializedTx:
                    '01000000018abb1ba63185d1f0793bfce13c28c891672ec416e18498810ad64b871c5a5715010000006b483045022100f0442b6d9c7533cd6f74afa993b280ed9475276d69df4dac631bc3b5591ba71b022051daf125372c1c477681bbd804a6445d8ff6840901854fb0b485b1c6c7866c44012102936f80cac2ba719ddb238646eb6b78a170a55a52a9b9f08c43523a4a6bd5c896ffffffff0200286bee000000001976a914fd61dd017dad1f505c0511142cc9ac51ef3a5beb88acc095a905000000001976a914aa7a6a1f43dfc34d17e562ce1845b804b73fc31e88ac00000000',
            },
        },
        {
            // NOTE: this is not a valid transaction
            // Input from https://dash1.trezor.io/tx/adb43bcd8fc99d6ed353c30ca8e5bd5996cd7bcf719bd4253f103dfb7227f6ed
            description: 'Dash: special input',
            params: {
                coin: 'Dash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/5'/0'/0/0"),
                        prev_hash:
                            'adb43bcd8fc99d6ed353c30ca8e5bd5996cd7bcf719bd4253f103dfb7227f6ed',
                        prev_index: 0,
                        amount: '167280961',
                    },
                ],
                outputs: [
                    {
                        address: 'XkNPrBSJtrHZUvUqb3JF4g5rMB3uzaJfEL',
                        amount: '167000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['adb43b']),
            },
            result: {
                serializedTx:
                    '0100000001edf62772fb3d103f25d49b71cf7bcd9659bde5a80cc353d36e9dc98fcd3bb4ad000000006b483045022100f7f940f5e3ca4cbe5d787d2dfb121dc56cd224da647b17a170e5e03b29e68744022002cc9d9d6b203180d1f68e64ba8a73fd9e983cca193b7bcf94e0156ed245bdfa012102936f80cac2ba719ddb238646eb6b78a170a55a52a9b9f08c43523a4a6bd5c896ffffffff01c037f409000000001976a9146a341485a9444b35dc9cb90d24e7483de7d37e0088ac00000000',
            },
        },
    ],
};
