export const fixtures = {
    valid: [
        {
            description: 'Decred output from address',
            arguments: {
                network: 'decred',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
                amount: '1',
            },
            expected: {
                name: 'sstxcommitment',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd601000000000000000058',
            },
        },
        {
            description: 'Decred testnet output from address',
            arguments: {
                network: 'decredTest',
                address: 'TsbhQ2iKSDmYAZ2BW1e8fvTavjpHvXD2HKq',
                amount: '2',
            },
            expected: {
                name: 'sstxcommitment',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd602000000000000000058',
            },
        },
        {
            description: 'Decred output/address from hash',
            arguments: {
                network: 'decred',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                amount: '1',
            },
            expected: {
                name: 'sstxcommitment',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd601000000000000000058',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        },
        {
            description: 'Decred output/address from output',
            arguments: {
                network: 'decred',
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd601000000000000000058',
            },
            options: {},
            expected: {
                name: 'sstxcommitment',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd601000000000000000058',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        },
    ],
    invalid: [
        {
            exception: 'Not enough data',
            arguments: {},
        },
        {
            description: 'Unexpected OP_DUP OP_HASH160',
            exception: 'sstxcommitment output is invalid',
            arguments: {
                output: 'OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
            },
        },
        {
            description: 'Hash too short (missing amount + fee)',
            exception: 'sstxcommitment output is invalid',
            arguments: {
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd6',
            },
        },
        {
            description: 'Invalid Network',
            exception: 'Invalid checksum',
            arguments: {
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        },
        {
            exception: 'Invalid version or Network mismatch',
            arguments: {
                network: 'decredTest',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        },
        {
            exception: 'DsmcYVbP1Nmag2H4AS17UTvmWXmGeA7nLD invalid address length',
            arguments: {
                network: 'decred',
                address: 'DsmcYVbP1Nmag2H4AS17UTvmWXmGeA7nLD',
            },
        },
        {
            description: 'address.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                network: 'decred',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
                hash: 'ffffffffffffffffffffffffffffffffffffffff',
            },
        },
        {
            description: 'address.hash != output.hash',
            exception: 'Hash mismatch',
            arguments: {
                network: 'decred',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
                output: 'OP_RETURN ffffffffffffffffffffffffffffffffffffffff01000000000000000058',
            },
        },
        {
            description: 'output.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd601000000000000000058',
                hash: 'ffffffffffffffffffffffffffffffffffffffff',
            },
        },
    ],
    dynamic: {
        depends: {
            address: ['address', 'output', 'hash'],
            hash: ['address', 'output', 'hash'],
            output: ['address', 'output', 'hash'],
        },
        details: [
            {
                description: 'sstxcommitment',
                network: 'decred',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_RETURN 751e76e8199196d454941c45d1b3a323f1433bd601000000000000000058',
                amount: '1',
            },
        ],
    },
};
