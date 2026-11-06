const name = 'signTransaction';

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'hidden',
                value: 'zec',
            },
            {
                name: 'inputs',
                type: 'json',
                value: [
                    {
                        address_n: [
                            (44 | 0x80000000) >>> 0,
                            (133 | 0x80000000) >>> 0,
                            (0 | 0x80000000) >>> 0,
                            0,
                            1,
                        ],
                        prev_hash:
                            '1d96b1cbb9f7ba15a2e6c5950c6c508fe413b8b3aab279f2a27ebfabf0af98e9',
                        prev_index: 0,
                        amount: '16651',
                    },
                ],
            },
            {
                name: 'outputs',
                type: 'json',
                value: [
                    {
                        address: 't1a4gB4zwx5WCTzabBMTttFqLiBrDFeUfTC',
                        amount: '6651',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            },
            {
                name: 'overwintered',
                type: 'checkbox',
                value: true,
            },
            {
                name: 'version',
                type: 'number',
                value: 5,
            },
            {
                name: 'versionGroupId',
                type: 'number',
                value: 0x26a7270a,
            },
            {
                name: 'push',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'chunkify',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
