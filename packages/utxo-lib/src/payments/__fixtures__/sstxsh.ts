export const fixtures = {
    valid: [
        // https://dcrdata.decred.org/tx/47ea6ae79067270b9d7fd09d530886610494c9aaecb2bebe897ef9b5127aad25
        {
            description: 'Decred output from address',
            arguments: {
                network: 'decred',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
            },
            expected: {
                name: 'sstxsh',
                hash: 'c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4',
                output: 'OP_SSTX OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4 OP_EQUAL',
            },
        },
        // {
        //     description: 'Decred testnet output from address',
        //     arguments: {
        //         network: 'decredTest',
        //         address: 'TsbhQ2iKSDmYAZ2BW1e8fvTavjpHvXD2HKq',
        //     },
        //     expected: {
        //         name: 'sstxpkh',
        //         hash: '751e76e8199196d454941c45d1b3a323f1433bd6',
        //         output: 'OP_SSTX OP_DUP OP_HASH160 751e76e8199196d454941c45d1b3a323f1433bd6 OP_EQUALVERIFY OP_CHECKSIG',
        //     },
        // },
        {
            description: 'Decred output/address from hash',
            arguments: {
                network: 'decred',
                hash: 'c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4',
            },
            expected: {
                name: 'sstxsh',
                output: 'OP_SSTX OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4 OP_EQUAL',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
            },
        },
        {
            description: 'Decred output/address from output',
            arguments: {
                network: 'decred',
                output: 'OP_SSTX OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4 OP_EQUAL',
            },
            options: {},
            expected: {
                name: 'sstxsh',
                hash: 'c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
            },
        },
    ],
    invalid: [
        {
            exception: 'Not enough data',
            arguments: {},
        },
        {
            description: 'Unexpected OP_HASH160',
            exception: 'sstxsh output is invalid',
            arguments: {
                output: 'OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4 OP_EQUAL',
            },
        },
        {
            description: 'Hash too short',
            exception: 'sstxsh output is invalid',
            arguments: {
                output: 'OP_SSTX OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4 OP_EQUAL',
            },
        },
        {
            description: 'Invalid Network',
            exception: 'Invalid checksum',
            arguments: {
                network: 'bitcoin',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
            },
        },
        {
            description: 'Invalid Network (sstxpkh address)',
            exception: 'Invalid version or Network mismatch',
            arguments: {
                address: 'DsbeB3ap3RiS4CLpgd1yXMSKLdrNMppeBE9',
            },
        },
        {
            exception: 'Invalid version or Network mismatch',
            arguments: {
                network: 'decredTest',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
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
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
                hash: 'ffffffffffffffffffffffffffffffffffffffff',
            },
        },
        {
            description: 'address.hash != output.hash',
            exception: 'Hash mismatch',
            arguments: {
                network: 'decred',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
                output: 'OP_SSTX OP_HASH160 ffffffffffffffffffffffffffffffffffffffff OP_EQUAL',
            },
        },
        {
            description: 'output.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                output: 'OP_SSTX OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4 OP_EQUAL',
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
                description: 'sstxsh',
                network: 'decred',
                address: 'DcqpxMjckSty7zc4fL3CCPPGz1NWdiYsBXZ',
                hash: 'c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4',
                output: 'OP_SSTX OP_HASH160 c97cc74e5baeba4e2ab1735ffff77f2dc117c4b4 OP_EQUAL',
            },
        ],
    },
};
