export const transformToTrezorOutputs = [
    {
        description: 'Transform outputs to trezor-connect compatible output',
        outputs: [
            {
                address:
                    'addr_test1qr23dayvk6h0r3p207qakepgqp6g7v0a5a08d8dee4rx42dprlgc2l6yjncuuym9peve74vktfqzy72jnlmkveqe2qesuc7wjg',
                amount: '1344798',
                assets: [
                    {
                        unit: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa613156616375756d73',
                        quantity: '10',
                    },
                ],
                setMax: false,
            },
            {
                address:
                    'addr_test1qr23dayvk6h0r3p207qakepgqp6g7v0a5a08d8dee4rx42dprlgc2l6yjncuuym9peve74vktfqzy72jnlmkveqe2qesuc7wjg',
                amount: '1000000',
                assets: [],
                setMax: false,
            },
            {
                isChange: true,
                amount: '9237484',
                address:
                    'addr_test1qrm0fuq450ym8qtnln8wxzg4xgx2wftqh025rdw3t3smd4qle6svh9nacvm632nmcy6fnw9sq85tqkvhagfrhkj9tf6sjyf2vj',
                assets: [
                    {
                        quantity: '999919',
                        unit: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa613156616375756d73',
                    },
                    {
                        quantity: '1',
                        unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                    },
                ],
            },
        ],
        changeAddressParameters: {
            path: "m/1852'/1815'/1'/1/0",
            addressType: 0, // base (shelley+)
            stakingPath: "m/1852'/1815'/2/0",
        },
        result: [
            {
                address:
                    'addr_test1qr23dayvk6h0r3p207qakepgqp6g7v0a5a08d8dee4rx42dprlgc2l6yjncuuym9peve74vktfqzy72jnlmkveqe2qesuc7wjg',
                amount: '1344798',
                tokenBundle: [
                    {
                        policyId: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa6131',
                        tokenAmounts: [{ amount: '10', assetNameBytes: '56616375756d73' }],
                    },
                ],
            },
            {
                address:
                    'addr_test1qr23dayvk6h0r3p207qakepgqp6g7v0a5a08d8dee4rx42dprlgc2l6yjncuuym9peve74vktfqzy72jnlmkveqe2qesuc7wjg',
                amount: '1000000',
                tokenBundle: undefined,
            },
            {
                addressParameters: {
                    addressType: 0,
                    path: "m/1852'/1815'/1'/1/0",
                    stakingPath: "m/1852'/1815'/2/0",
                },
                amount: '9237484',
                tokenBundle: [
                    {
                        policyId: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa6131',
                        tokenAmounts: [{ amount: '999919', assetNameBytes: '56616375756d73' }],
                    },
                    {
                        policyId: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                        tokenAmounts: [{ amount: '1', assetNameBytes: '' }],
                    },
                ],
            },
        ],
    },
];

export const drepIdToHex = [
    {
        description: 'keyHash drep',
        drepId: 'drep16pxnn38ykshfahwmkaqmke3kdqaksg4w935d7uztvh8y5l48pxv',
        result: {
            type: 0,
            hex: 'd04d39c4e4b42e9edddbb741bb6636683b6822ae2c68df704b65ce4a',
        },
    },
    {
        description: 'scriptHash drep',
        drepId: 'drep_script16pxnn38ykshfahwmkaqmke3kdqaksg4w935d7uztvh8y5sh6f6d',
        result: {
            type: 1,
            hex: 'd04d39c4e4b42e9edddbb741bb6636683b6822ae2c68df704b65ce4a',
        },
    },
];
