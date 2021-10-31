export const fixtures = {
    valid: [
        {
            description: 'from pubkey with additional byte (derived from bip32)',
            arguments: {
                pubkey: '03cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115',
            },
            options: {},
            expected: {
                name: 'p2tr',
                hash: 'a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
                output: 'OP_1 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
            },
        },
        {
            description: 'from address testnet',
            arguments: {
                network: 'testnet',
                address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
            },
            options: {},
            expected: {
                name: 'p2tr',
                hash: '9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7',
                output: 'OP_1 9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7',
                address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
            },
        },
        {
            description: 'from output testnet',
            arguments: {
                network: 'testnet',
                output: 'OP_1 9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7',
            },
            options: {},
            expected: {
                name: 'p2tr',
                hash: '9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7',
                output: 'OP_1 9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7',
                address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
            },
        },
    ],
    invalid: [
        {
            exception: 'Not enough data',
            arguments: {},
        },
        {
            description: 'Unexpected OP_0',
            exception: 'p2tr output is invalid',
            arguments: {
                output: 'OP_0 9a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d7',
            },
        },
        {
            description: 'pubkey is too long',
            exception: 'of type ?Buffer|Buffer, got Buffer',
            arguments: {
                pubkey: 'cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc1150000',
            },
        },
        {
            exception: 'Invalid prefix or Network mismatch',
            arguments: {
                address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
            },
        },
        {
            exception: 'Invalid checksum for bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            arguments: {
                address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            },
        },
        {
            exception: 'Invalid address version',
            arguments: {
                address: 'bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs',
            },
        },
        {
            description: 'address.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            },
        },
        {
            description: 'address.hash != output.hash',
            exception: 'Hash mismatch',
            arguments: {
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                output: 'OP_1 ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            },
        },
        {
            description: 'output.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                output: 'OP_1 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
                hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            },
        },
        {
            description: 'pubkey.hash != H',
            exception: 'Hash mismatch',
            arguments: {
                pubkey: 'cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115',
                hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            },
        },
    ],
    dynamic: {
        depends: {
            address: ['address', 'output', 'pubkey'],
            output: ['address', 'output', 'pubkey'],
            hash: ['address', 'output', 'pubkey'],
        },
        details: [
            {
                description: 'bip 86 test vector 1',
                pubkey: 'cc8a4bc64d897bddc5fbc2f670f7a8ba0b386779106cf1223c6fc5d7cd6fc115',
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                hash: 'a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
                output: 'OP_1 a60869f0dbcf1dc659c9cecbaf8050135ea9e8cdc487053f1dc6880949dc684c',
            },
            {
                description: 'bip 86 test vector 2',
                pubkey: '83dfe85a3151d2517290da461fe2815591ef69f2b18a2ce63f01697a8b313145',
                address: 'bc1p4qhjn9zdvkux4e44uhx8tc55attvtyu358kutcqkudyccelu0was9fqzwh',
                hash: 'a82f29944d65b86ae6b5e5cc75e294ead6c59391a1edc5e016e3498c67fc7bbb',
                output: 'OP_1 a82f29944d65b86ae6b5e5cc75e294ead6c59391a1edc5e016e3498c67fc7bbb',
            },
            {
                description: 'bip 86 test vector 3',
                pubkey: '399f1b2f4393f29a18c937859c5dd8a77350103157eb880f02e8c08214277cef',
                address: 'bc1p3qkhfews2uk44qtvauqyr2ttdsw7svhkl9nkm9s9c3x4ax5h60wqwruhk7',
                hash: '882d74e5d0572d5a816cef0041a96b6c1de832f6f9676d9605c44d5e9a97d3dc',
                output: 'OP_1 882d74e5d0572d5a816cef0041a96b6c1de832f6f9676d9605c44d5e9a97d3dc',
            },
        ],
    },
};
