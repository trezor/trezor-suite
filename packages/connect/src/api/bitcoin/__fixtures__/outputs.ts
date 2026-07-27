export const validateTrezorOutputs = [
    {
        description: 'external output with explicit PAYTOADDRESS',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
                script_type: 'PAYTOADDRESS',
            },
        ],
        result: [{ address: '1BitcoinEaterAddressDontSendf59kuE', script_type: 'PAYTOADDRESS' }],
    },
    {
        description: 'external output with missing script_type defaults to PAYTOADDRESS',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
            },
        ],
        result: [{ address: '1BitcoinEaterAddressDontSendf59kuE', script_type: 'PAYTOADDRESS' }],
    },
    {
        description: 'change output with address_n infers script_type from path',
        params: [
            {
                address_n: "m/44'/0'/0'/1/0",
                amount: '100000',
            },
        ],
        result: [{ script_type: 'PAYTOADDRESS' }],
    },
    {
        description: 'external output with PAYTOWITNESS throws',
        params: [
            {
                address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
                amount: '100000',
                script_type: 'PAYTOWITNESS',
            },
        ],
        error: 'External output (with address) must use script_type PAYTOADDRESS',
    },
    {
        description: 'external output with PAYTOP2SHWITNESS throws',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
                script_type: 'PAYTOP2SHWITNESS',
            },
        ],
        error: 'External output (with address) must use script_type PAYTOADDRESS',
    },
    {
        description: 'external output with PAYTOTAPROOT throws',
        params: [
            {
                address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
                amount: '100000',
                script_type: 'PAYTOTAPROOT',
            },
        ],
        error: 'External output (with address) must use script_type PAYTOADDRESS',
    },
    {
        description: 'output with both address and address_n throws',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                address_n: [0],
                amount: '100000',
                script_type: 'PAYTOADDRESS',
            },
        ],
        error: 'Cannot use address and address_n in one output',
    },
    {
        description: 'external output with invalid address throws',
        params: [
            {
                address: 'not-a-valid-bitcoin-address',
                amount: '100000',
                script_type: 'PAYTOADDRESS',
            },
        ],
        error: 'Invalid Bitcoin output address not-a-valid-bitcoin-address',
    },
    {
        description: 'non-string script_type throws at param validation',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
                script_type: 0,
            },
        ],
        error: 'Parameter "script_type" has invalid type. "string" expected.',
    },
];
