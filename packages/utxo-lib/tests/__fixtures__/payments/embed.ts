export const fixtures = {
    valid: [
        {
            description: 'output from output',
            arguments: {
                output: 'OP_RETURN a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
            },
            options: {},
            expected: {
                data: [
                    'a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                ],
                output: 'OP_RETURN a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                input: null,
                witness: null,
            },
        },
        {
            description: 'output from data',
            arguments: {
                data: [
                    'a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                ],
            },
            expected: {
                data: [
                    'a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                ],
                output: 'OP_RETURN a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                input: null,
                witness: null,
            },
        },
    ],
    invalid: [
        {
            exception: 'Not enough data',
            arguments: {},
        },
        {
            description: 'First OP is not OP_RETURN',
            exception: 'Output is invalid',
            options: {},
            arguments: {
                output: 'OP_1 OP_2 OP_ADD',
            },
        },
        {
            description: 'Return value and data do not match',
            exception: 'Data mismatch',
            options: {},
            arguments: {
                output: 'OP_RETURN a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                data: [
                    'a3b147dbe4a85579fc4b5a1855555555555555555555555555555555555555555555555555555555',
                ],
            },
        },
        {
            description: 'Script length incorrect',
            exception: 'Data mismatch',
            options: {},
            arguments: {
                output: 'OP_RETURN a3b1 47db',
                data: ['a3b1'],
            },
        },
        {
            description: 'Return data is not buffer',
            exception: 'Output is invalid',
            options: {},
            arguments: {
                output: 'OP_RETURN OP_1',
            },
        },
    ],
    dynamic: {
        depends: {
            data: ['data', 'output'],
            output: ['output', 'data'],
        },
        details: [
            {
                description: 'embed',
                data: [
                    'a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                ],
                output: 'OP_RETURN a3b147dbe4a85579fc4b5a1811e76620560e07267e62b9a0d6858f9127735cadd82f67e06c24dbc4',
            },
            {
                description: 'embed',
                data: [
                    'a3b147dbe4a85579fc4b5a1811e76620560e0726',
                    '7e62b9a0d6858f9127735cadd82f67e06c24dbc4',
                ],
                output: 'OP_RETURN a3b147dbe4a85579fc4b5a1811e76620560e0726 7e62b9a0d6858f9127735cadd82f67e06c24dbc4',
            },
        ],
    },
};
