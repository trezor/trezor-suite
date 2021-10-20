export default [
    {
        description: 'builds a simple tx without change',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '2001',
            feePerByte: '10.261538461538462',
            max: undefined,
            totalSpent: '102001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds an incomplete tx without change',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    amount: '100000',
                    type: 'noaddress',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '2001',
            feePerByte: '10.261538461538462',
            max: undefined,
            totalSpent: '102001',
            type: 'nonfinal',
        },
    },
    {
        description: 'fails on little funds',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    amount: '100000',
                    type: 'noaddress',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '10',
                    vsize: 0,
                },
            ],
        },
        result: {
            error: 'NOT-ENOUGH-FUNDS',
            type: 'error',
        },
    },
    {
        description: 'builds a send-max with large input',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    type: 'send-max',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '50000000000',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '1950',
            feePerByte: '10',
            max: '49999998050',
            totalSpent: '50000000000',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '49999998050',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a send-max',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    type: 'send-max',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '1950',
            feePerByte: '10',
            max: '100051',
            totalSpent: '102001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '100051',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'fails on weird output type',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    type: 'weird-output-type',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '10',
                    vsize: 0,
                },
            ],
        },
        result: {
            error: 'WRONG-OUTPUT-TYPE',
            type: 'error',
        },
    },
    {
        description: 'fails on empty outputs + utxos input',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [],
            segwit: false,
            utxos: [],
        },
        result: {
            error: 'EMPTY',
            type: 'error',
        },
    },
    {
        description: 'fails on empty outputs input',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            error: 'EMPTY',
            type: 'error',
        },
    },
    {
        description: 'fails on empty utxos input',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    type: 'send-max',
                },
            ],
            segwit: false,
            utxos: [],
        },
        result: {
            error: 'NOT-ENOUGH-FUNDS',
            type: 'error',
        },
    },
    {
        description: 'builds a simple tx with two outputs and change',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'complete',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '20000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 263,
            fee: '2630',
            feePerByte: '10',
            max: undefined,
            totalSpent: '52630',
            transaction: {
                PERM_outputs: {
                    permutation: [1, 0, 2],
                    sorted: [
                        {
                            address: '1LetUsDestroyBitcoinTogether398Nrg',
                            value: '20000',
                        },
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '30000',
                        },
                        {
                            path: [44, 1, 1, 0],
                            segwit: false,
                            value: '49371',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx with two outputs and change (segwit)',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'complete',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '20000',
                    type: 'complete',
                },
            ],
            segwit: true,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 203,
            fee: '2030',
            feePerByte: '10',
            max: undefined,
            totalSpent: '52030',
            transaction: {
                PERM_outputs: {
                    permutation: [1, 0, 2],
                    sorted: [
                        {
                            address: '1LetUsDestroyBitcoinTogether398Nrg',
                            value: '20000',
                        },
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '30000',
                        },
                        {
                            path: [44, 1, 1, 0],
                            segwit: true,
                            value: '49971',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        amount: '102001',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: true,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'prefers a more confirmed input',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 1,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: null,
                    index: 2,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '2001',
            feePerByte: '10.261538461538462',
            max: undefined,
            totalSpent: '102001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 1,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'fails on two send maxes',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    type: 'send-max',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    type: 'send-max',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            error: 'TWO-SEND-MAX',
            type: 'error',
        },
    },
    {
        description: 'two inputs',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '200000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 1,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 2,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 345,
            fee: '4002',
            feePerByte: '11.6',
            max: undefined,
            totalSpent: '204002',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '200000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 1,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 2,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx with two same value outputs and change (segwit)',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'complete',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '30000',
                    type: 'complete',
                },
            ],
            segwit: true,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 203,
            fee: '2030',
            feePerByte: '10',
            max: undefined,
            totalSpent: '62030',
            transaction: {
                PERM_outputs: {
                    permutation: [0, 1, 2],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '30000',
                        },
                        {
                            address: '1LetUsDestroyBitcoinTogether398Nrg',
                            value: '30000',
                        },
                        {
                            path: [44, 1, 1, 0],
                            segwit: true,
                            value: '39971',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        amount: '102001',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: true,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'explicit dust threshold stops change',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 54600,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '928960',
                    type: 'complete',
                },
            ],
            segwit: true,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '972463',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 137,
            fee: '43503',
            feePerByte: '317.54014598540147',
            max: undefined,
            totalSpent: '972463',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '928960',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: true,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a tx with 1 op-return and change',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    dataHex: 'deadbeef',
                    type: 'opreturn',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 210,
            fee: '2100',
            feePerByte: '10',
            max: undefined,
            totalSpent: '2100',
            transaction: {
                PERM_outputs: {
                    permutation: [0, 1],
                    sorted: [
                        {
                            opReturnData: {
                                type: 'Buffer',
                                data: [222, 173, 190, 239],
                            },
                        },
                        {
                            path: [44, 1, 1, 0],
                            segwit: false,
                            value: '99901',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a tx with 2 op-returns and change',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    dataHex: 'deadbeef',
                    type: 'opreturn',
                },
                {
                    dataHex: 'c0ffee',
                    type: 'opreturn',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 224,
            fee: '2240',
            feePerByte: '10',
            max: undefined,
            totalSpent: '2240',
            transaction: {
                PERM_outputs: {
                    permutation: [1, 0, 2],
                    sorted: [
                        {
                            opReturnData: {
                                type: 'Buffer',
                                data: [192, 255, 238],
                            },
                        },
                        {
                            opReturnData: {
                                type: 'Buffer',
                                data: [222, 173, 190, 239],
                            },
                        },
                        {
                            path: [44, 1, 1, 0],
                            segwit: false,
                            value: '99761',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx without change (recv bech32)',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 192,
            fee: '2001',
            feePerByte: '10.421875',
            max: undefined,
            totalSpent: '102001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx without change (recv p2sh)',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 193,
            fee: '2001',
            feePerByte: '10.367875647668393',
            max: undefined,
            totalSpent: '102001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx without change (recv bech32 p2sh)',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: 'bc1qc7slrfxkknqcq2jevvvkdgvrt8080852dfjewde450xdlk4ugp7szw5tk9',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '103001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 204,
            fee: '3001',
            feePerByte: '14.71078431372549',
            max: undefined,
            totalSpent: '103001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address:
                                'bc1qc7slrfxkknqcq2jevvvkdgvrt8080852dfjewde450xdlk4ugp7szw5tk9',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'builds a send-max-noaddress',
        request: {
            basePath: [44, 1],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    type: 'send-max-noaddress',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '1950',
            feePerByte: '10',
            max: '100051',
            totalSpent: '102001',
            type: 'nonfinal',
        },
    },
    {
        description: 'builds a simple tx without change (cashaddr)',
        request: {
            basePath: [44, 1],
            changeAddress: 'bitcoincash:qzppkat2v7xu9fr3yeuqdnggjqqltrs7pcg8swvhl0',
            network: 'bitcoincash',
            changeId: 0,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: false,
            outputs: [
                {
                    address: 'bitcoincash:qp6e6enhpy0fwwu7nkvlr8rgl06ru0c9lywalz8st5',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [3, 4],
                    coinbase: false,
                    height: 100,
                    index: 0,
                    own: true,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '102001',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 195,
            fee: '2001',
            feePerByte: '10.261538461538462',
            max: undefined,
            totalSpent: '102001',
            transaction: {
                PERM_outputs: {
                    permutation: [0],
                    sorted: [
                        {
                            address: 'bitcoincash:qp6e6enhpy0fwwu7nkvlr8rgl06ru0c9lywalz8st5',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        path: [44, 1, 3, 4],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'skipUtxoSelection: tx with multiple inputs and change',
        request: {
            basePath: [44, 1, 0],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 1,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            skipUtxoSelection: true,
            utxos: [
                {
                    addressPath: [1, 0],
                    height: 100,
                    index: 0,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '105291',
                    vsize: 0,
                },
                {
                    addressPath: [0, 1],
                    height: 100,
                    index: 0,
                    transactionHash: 'c4dc0ffeee',
                    tsize: 0,
                    value: '202001',
                    vsize: 0,
                },
                {
                    addressPath: [0, 2],
                    height: 100,
                    index: 0,
                    transactionHash: 'd4dc0ffeee',
                    tsize: 0,
                    value: '200000',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 529,
            fee: '5290',
            feePerByte: '10',
            max: undefined,
            totalSpent: '105290',
            transaction: {
                PERM_outputs: {
                    permutation: [0, 1],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '100000',
                        },
                        {
                            value: '402002',
                            path: [44, 1, 0, 1, 1],
                            segwit: false,
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        amount: '105291',
                        path: [44, 1, 0, 1, 0],
                        segwit: false,
                    },
                    {
                        REV_hash: 'c4dc0ffeee',
                        index: 0,
                        amount: '202001',
                        path: [44, 1, 0, 0, 1],
                        segwit: false,
                    },
                    {
                        REV_hash: 'd4dc0ffeee',
                        index: 0,
                        amount: '200000',
                        path: [44, 1, 0, 0, 2],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'skipUtxoSelection: tx with multiple inputs and change (segwit)',
        request: {
            basePath: [49, 1, 0],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 1,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: true,
            skipUtxoSelection: true,
            utxos: [
                {
                    addressPath: [1, 0],
                    height: 100,
                    index: 0,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '103531',
                    vsize: 0,
                },
                {
                    addressPath: [0, 1],
                    height: 100,
                    index: 0,
                    transactionHash: 'c4dc0ffeee',
                    tsize: 0,
                    value: '202001',
                    vsize: 0,
                },
                {
                    addressPath: [0, 2],
                    height: 100,
                    index: 0,
                    transactionHash: 'd4dc0ffeee',
                    tsize: 0,
                    value: '200000',
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 353,
            fee: '3530',
            feePerByte: '10',
            max: undefined,
            totalSpent: '103530',
            transaction: {
                PERM_outputs: {
                    permutation: [0, 1],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '100000',
                        },
                        {
                            value: '402002',
                            path: [49, 1, 0, 1, 1],
                            segwit: true,
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        amount: '103531',
                        path: [49, 1, 0, 1, 0],
                        segwit: true,
                    },
                    {
                        REV_hash: 'c4dc0ffeee',
                        index: 0,
                        amount: '202001',
                        path: [49, 1, 0, 0, 1],
                        segwit: true,
                    },
                    {
                        REV_hash: 'd4dc0ffeee',
                        index: 0,
                        amount: '200000',
                        path: [49, 1, 0, 0, 2],
                        segwit: true,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'use required (coinbase + unconfirmed) instead of more suitable utxo',
        request: {
            basePath: [44, 1, 0],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 1,
            dustThreshold: 546,
            feeRate: '10',
            height: 200,
            inputAmounts: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [1, 0],
                    height: 200,
                    index: 0,
                    transactionHash: 'a4dc0ffeee',
                    tsize: 0,
                    value: '65291',
                    vsize: 0,
                    coinbase: true,
                    own: false,
                    required: true,
                },
                {
                    addressPath: [0, 1],
                    height: 150,
                    index: 0,
                    transactionHash: 'c4dc0ffeee',
                    tsize: 0,
                    value: '202001',
                    coinbase: false,
                    own: true,
                    vsize: 0,
                },
                {
                    addressPath: [1, 1],
                    index: 0,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '55291',
                    vsize: 0,
                    coinbase: false,
                    own: false,
                    required: true,
                },
                {
                    addressPath: [0, 2],
                    height: 100,
                    index: 0,
                    transactionHash: 'd4dc0ffeee',
                    tsize: 0,
                    value: '200000',
                    coinbase: false,
                    own: true,
                    vsize: 0,
                },
            ],
        },
        result: {
            bytes: 379,
            fee: '3790',
            feePerByte: '10',
            max: undefined,
            totalSpent: '103790',
            transaction: {
                PERM_outputs: {
                    permutation: [1, 0],
                    sorted: [
                        {
                            value: '16792',
                            path: [44, 1, 0, 1, 1],
                            segwit: false,
                        },
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '100000',
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'a4dc0ffeee',
                        index: 0,
                        amount: '65291',
                        path: [44, 1, 0, 1, 0],
                        segwit: false,
                    },
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 0,
                        amount: '55291',
                        path: [44, 1, 0, 1, 1],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
    {
        description: 'skip inputs/outputs permutation',
        request: {
            basePath: [44, 1, 0],
            changeAddress: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
            changeId: 1,
            dustThreshold: 546,
            feeRate: '10',
            height: 100,
            inputAmounts: true,
            skipPermutation: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '70000',
                    type: 'complete',
                },
            ],
            segwit: false,
            utxos: [
                {
                    addressPath: [1, 0],
                    fee: '0',
                    height: 60,
                    index: 0,
                    transactionHash: 'a4dc0ffeee',
                    tsize: 0,
                    value: '65291',
                    vsize: 0,
                    coinbase: false,
                    own: false,
                },
                {
                    addressPath: [1, 1],
                    fee: '0',
                    height: 50,
                    index: 1,
                    transactionHash: 'b4dc0ffeee',
                    tsize: 0,
                    value: '55291',
                    vsize: 0,
                    coinbase: false,
                    own: false,
                },
            ],
        },
        result: {
            bytes: 379,
            fee: '3790',
            feePerByte: '10',
            max: undefined,
            totalSpent: '73790',
            transaction: {
                PERM_outputs: {
                    permutation: [0, 1],
                    sorted: [
                        {
                            address: '1BitcoinEaterAddressDontSendf59kuE',
                            value: '70000',
                        },
                        {
                            value: '46792',
                            path: [44, 1, 0, 1, 1],
                            segwit: false,
                        },
                    ],
                },
                inputs: [
                    {
                        REV_hash: 'a4dc0ffeee',
                        index: 0,
                        amount: '65291',
                        path: [44, 1, 0, 1, 0],
                        segwit: false,
                    },
                    {
                        REV_hash: 'b4dc0ffeee',
                        index: 1,
                        amount: '55291',
                        path: [44, 1, 0, 1, 1],
                        segwit: false,
                    },
                ],
            },
            type: 'final',
        },
    },
];
