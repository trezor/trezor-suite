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
    {
        description: 'external output with contact fields passes them through',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
                contact_pubkey: 'abababababababababababababababababababababababababababababababab',
                contact_signature:
                    'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd',
            },
        ],
        result: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                contact_pubkey: 'abababababababababababababababababababababababababababababababab',
                contact_signature:
                    'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd',
            },
        ],
    },
    {
        description: 'external output with a contact pubkey but no signature throws',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
                contact_pubkey: 'abababababababababababababababababababababababababababababababab',
            },
        ],
        error: 'Contact fields must be a 32-byte public key and a 64-byte signature, both hex',
    },
    {
        description: 'external output with a contact signature that is not hex throws',
        params: [
            {
                address: '1BitcoinEaterAddressDontSendf59kuE',
                amount: '100000',
                contact_pubkey: 'abababababababababababababababababababababababababababababababab',
                contact_signature:
                    'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
            },
        ],
        error: 'Contact fields must be a 32-byte public key and a 64-byte signature, both hex',
    },
    {
        description: 'change output with contact fields throws',
        params: [
            {
                address_n: "m/44'/0'/0'/1/0",
                amount: '100000',
                contact_pubkey: 'abababababababababababababababababababababababababababababababab',
                contact_signature:
                    'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd',
            },
        ],
        error: 'Contact fields are allowed only on a single-signature external output',
    },
];
