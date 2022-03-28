// https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/test_msg_stellar_get_address.py

export default {
    method: 'stellarGetAddress',
    setup: {
        mnemonic: 'illness spike retreat truth genius clock brain pass fit cave bargain toe',
    },
    tests: [
        {
            description: "m/44'/148'/0'",
            params: {
                path: "m/44'/148'/0'",
            },
            result: {
                address: 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6',
            },
        },
        {
            description: "m/44'/148'/1'",
            params: {
                path: "m/44'/148'/1'",
            },
            result: {
                address: 'GBAW5XGWORWVFE2XTJYDTLDHXTY2Q2MO73HYCGB3XMFMQ562Q2W2GJQX',
            },
        },
        {
            description: "m/44'/148'",
            params: {
                path: "m/44'/148'",
            },
            result: false,
        },
        {
            description: '[0]',
            params: {
                path: [0],
            },
            result: false,
        },
    ],
};
