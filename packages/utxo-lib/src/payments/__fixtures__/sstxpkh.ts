export const fixtures = {
    valid: [
        {
            description: 'Decred output from address',
            arguments: {
                network: 'decred',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
            expected: {
                name: 'sstxpkh',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
            },
        },
        {
            description: 'Decred testnet output from address',
            arguments: {
                network: 'decredTest',
                address: 'TsbhQ2iKSDmYAZ2BW1e8fvTavjpHvXD2HKq',
            },
            expected: {
                name: 'sstxpkh',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
            },
        },
        {
            description: 'Decred output/address from hash',
            arguments: {
                network: 'decred',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
            },
            expected: {
                name: 'sstxpkh',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        },
        {
            description: 'Decred output/address from output',
            arguments: {
                network: 'decred',
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
            },
            options: {},
            expected: {
                name: 'sstxpkh',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
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
            exception: 'sstxpkh output is invalid',
            arguments: {
                output: 'OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
            },
        },
        {
            description: 'Hash too short',
            exception: 'sstxpkh output is invalid',
            arguments: {
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433b OP_EQUALVERIFY OP_CHECKSIG',
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
            description: 'Invalid Network (sstxsh address)',
            exception: 'Invalid checksum',
            arguments: {
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
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
                output: 'OP_SSTX OP_DUP OP_HASH160 ffffffffffffffffffffffffffffffffffffffff OP_EQUALVERIFY OP_CHECKSIG',
            },
        },
        {
            description: 'output.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
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
                description: 'sstxpkh',
                network: 'decred',
                hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
                output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        ],
    },
};
