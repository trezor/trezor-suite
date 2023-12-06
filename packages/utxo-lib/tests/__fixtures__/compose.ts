export const UTXO = {
    path: [44, 1, 0, 0, 0], // NOTE: this field is not required by the ComposeInput interface, yet it is accepted in and received out
    coinbase: false,
    own: true,
    confirmations: 100,
    vout: 0,
    txid: 'b4dc0ffeee',
    amount: '102001',
};

export default [
    {
        description: 'builds a simple tx without change',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                    customField: 'prove that payment output is generic',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 192,
            fee: '2001',
            feePerByte: '10.421875',
            max: undefined,
            totalSpent: '102001',
            inputs: [UTXO],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                    customField: 'prove that payment output is generic',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx without change and decimal fee',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10.33',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 192,
            fee: '2001',
            feePerByte: '10.421875', // feeRate is greater than requested because of dust limit
            max: undefined,
            totalSpent: '102001',
            inputs: [UTXO],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'builds an payment tx without change',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    amount: '100000',
                    type: 'payment-noaddress',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 192,
            fee: '2001',
            feePerByte: '10.421875',
            max: undefined,
            totalSpent: '102001',
            type: 'nonfinal',
            inputs: [UTXO],
        },
    },
    {
        description: 'fails on little funds',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    amount: '100000',
                    type: 'payment-noaddress',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '10',
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
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    type: 'send-max',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '50000000000',
                },
            ],
        },
        result: {
            bytes: 192,
            fee: '1920',
            feePerByte: '10',
            max: '49999998080',
            totalSpent: '50000000000',
            inputs: [{ ...UTXO, amount: '50000000000' }],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '49999998080',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'builds a send-max',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    type: 'send-max',
                    customField: 'prove that send-max output is generic',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 192,
            fee: '1920',
            feePerByte: '10',
            max: '100081',
            totalSpent: '102001',
            inputs: [UTXO],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100081',
                    type: 'payment',
                    customField: 'prove that send-max output is generic',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx with two outputs and change',
        request: {
            changeAddress: {
                address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                path: [44, 1, 1, 0],
            },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '20000',
                    type: 'payment',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 260,
            fee: '2600',
            feePerByte: '10',
            max: undefined,
            totalSpent: '52600',
            inputs: [UTXO],
            outputs: [
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '20000',
                    type: 'payment',
                },
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    path: [44, 1, 1, 0],
                    amount: '49401',
                    type: 'change',
                },
            ],
            outputsPermutation: [1, 0, 2],
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx with two outputs and change (decimal feeRate)',
        request: {
            changeAddress: {
                address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                path: "m/44'/0'/0'/1/0",
            },
            dustThreshold: 546,
            feeRate: '10.71',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '20000',
                    type: 'payment',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 260,
            fee: '2785', // 260 * 10.71
            feePerByte: '10.711538461538462',
            max: undefined,
            totalSpent: '52785',
            inputs: [UTXO],
            outputs: [
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '20000',
                    type: 'payment',
                },
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    path: "m/44'/0'/0'/1/0",
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    amount: '49216',
                    type: 'change',
                },
            ],
            outputsPermutation: [1, 0, 2],
            type: 'final',
        },
    },
    {
        description: 'builds a simple tx with two outputs and change (p2sh/segwit)',
        request: {
            txType: 'p2sh',
            changeAddress: { address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn',
                    amount: '20000',
                    type: 'payment',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 198,
            fee: '1980',
            feePerByte: '10',
            max: undefined,
            totalSpent: '51980',
            inputs: [UTXO],
            outputs: [
                {
                    address: '3FyVFsEyyBPzHjD3qUEgX7Jsn4tcHNZFkn',
                    amount: '20000',
                    type: 'payment',
                },
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '50021',
                    type: 'change',
                },
            ],
            outputsPermutation: [1, 0, 2],
            type: 'final',
        },
    },
    {
        description: 'prefers a more confirmed input',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    confirmations: 100,
                    vout: 1,
                },
                {
                    ...UTXO,
                    confirmations: 5,
                    vout: 2,
                },
            ],
        },
        result: {
            bytes: 192,
            fee: '2001',
            feePerByte: '10.421875',
            max: undefined,
            totalSpent: '102001',
            inputs: [{ ...UTXO, confirmations: 100, vout: 1 }],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'two inputs',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '200000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    vout: 1,
                },
                {
                    ...UTXO,
                    vout: 2,
                },
            ],
        },
        result: {
            bytes: 340,
            fee: '4002',
            feePerByte: '11.770588235294118',
            max: undefined,
            totalSpent: '204002',
            inputs: [
                { ...UTXO, vout: 1 },
                { ...UTXO, vout: 2 },
            ],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '200000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'builds a p2sh tx with two same value outputs (mixed p2sh + p2pkh) and change',
        request: {
            txType: 'p2sh',
            changeAddress: { address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '30000',
                    type: 'payment',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 200,
            fee: '2000',
            feePerByte: '10',
            max: undefined,
            totalSpent: '62000',
            inputs: [UTXO],
            outputs: [
                {
                    address: '1LetUsDestroyBitcoinTogether398Nrg',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '30000',
                    type: 'payment',
                },
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '40001',
                    type: 'change',
                },
            ],
            outputsPermutation: [1, 0, 2],
            type: 'final',
        },
    },
    {
        description: 'explicit dust threshold stops change (ps2h/segwit)',
        request: {
            txType: 'p2sh',
            changeAddress: { address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr' },
            dustThreshold: 54600,
            feeRate: '10',
            outputs: [
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '928960',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '972463',
                },
            ],
        },
        result: {
            bytes: 134,
            fee: '43503',
            feePerByte: '324.64925373134326',
            max: undefined,
            totalSpent: '972463',
            inputs: [{ ...UTXO, amount: '972463' }],
            outputs: [
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '928960',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'builds a tx with 1 op-return and change',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    dataHex: 'deadbeef',
                    type: 'opreturn',
                    customField: 'prove that opreturn output is generic',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 207,
            fee: '2070',
            feePerByte: '10',
            max: undefined,
            totalSpent: '2070',
            inputs: [UTXO],
            outputs: [
                {
                    dataHex: 'deadbeef',
                    type: 'opreturn',
                    customField: 'prove that opreturn output is generic',
                },
                {
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    amount: '99931',
                    type: 'change',
                },
            ],
            outputsPermutation: [0, 1],
            type: 'final',
        },
    },
    {
        description: 'builds a tx with 2 op-returns and change',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
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
            utxos: [UTXO],
        },
        result: {
            bytes: 221,
            fee: '2210',
            feePerByte: '10',
            max: undefined,
            totalSpent: '2210',
            inputs: [UTXO],
            outputs: [
                {
                    dataHex: 'c0ffee',
                    type: 'opreturn',
                },
                {
                    dataHex: 'deadbeef',
                    type: 'opreturn',
                },
                {
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    amount: '99791',
                    type: 'change',
                },
            ],
            outputsPermutation: [1, 0, 2],
            type: 'final',
        },
    },
    {
        description: 'builds bech32/p2wpkh tx without change (drop dust)',
        request: {
            txType: 'p2wpkh',
            changeAddress: { address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '101500',
                },
            ],
        },
        result: {
            bytes: 110,
            fee: '1500',
            feePerByte: '13.636363636363637',
            max: undefined,
            totalSpent: '101500',
            inputs: [{ ...UTXO, amount: '101500' }],
            outputs: [
                {
                    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description:
            'builds bech32/p2wpkh tx, no explicit dustThreshold (change above calculated dust)',
        request: {
            txType: 'p2wpkh',
            changeAddress: { address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d' },
            dustThreshold: 0,
            feeRate: '10',
            outputs: [
                {
                    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '101900',
                },
            ],
        },
        result: {
            bytes: 141,
            fee: '1410',
            feePerByte: '10',
            max: undefined,
            totalSpent: '101410',
            inputs: [{ ...UTXO, amount: '101900' }],
            outputs: [
                {
                    address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
                    amount: '490',
                    type: 'change',
                },
                {
                    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [1, 0],
            type: 'final',
        },
    },
    {
        description: 'builds Legacy Segwit/p2sh tx without change (drop dust)',
        request: {
            txType: 'p2sh',
            changeAddress: { address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [{ ...UTXO, amount: '101500' }],
        },
        result: {
            bytes: 134,
            fee: '1500',
            feePerByte: '11.194029850746269',
            max: undefined,
            totalSpent: '101500',
            inputs: [{ ...UTXO, amount: '101500' }],
            outputs: [
                {
                    address: '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description:
            'builds Legacy Segwit/p2sh tx, no explicit dustThreshold (change above calculated dust)',
        request: {
            txType: 'p2sh',
            changeAddress: { address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr' },
            dustThreshold: 0,
            feeRate: '10',
            outputs: [
                {
                    address: '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '102000',
                },
            ],
        },
        result: {
            bytes: 166,
            fee: '1660',
            feePerByte: '10',
            max: undefined,
            totalSpent: '101660',
            inputs: [{ ...UTXO, amount: '102000' }],
            outputs: [
                {
                    address: '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr',
                    amount: '340',
                    type: 'change',
                },
                {
                    address: '3NukJ6fYZJ5Kk8bPjycAnruZkE5Q7UW7i8',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [1, 0],
            type: 'final',
        },
    },
    {
        description: 'builds taproot/p2tr tx without change (drop dust)',
        request: {
            txType: 'p2tr',
            changeAddress: {
                address: 'bc1pgypgja2hmcx2l6s2ssq75k6ev68ved6nujcspt47dgvkp8euc70s6uegk6',
            },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: 'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '101500',
                },
            ],
        },
        result: {
            bytes: 111,
            fee: '1500',
            feePerByte: '13.513513513513514',
            max: undefined,
            totalSpent: '101500',
            inputs: [{ ...UTXO, amount: '101500' }],
            outputs: [
                {
                    address: 'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description:
            'builds taproot/p2tr tx, no explicit dustThreshold (change above calculated dust)',
        request: {
            txType: 'p2tr',
            changeAddress: {
                address: 'bc1pgypgja2hmcx2l6s2ssq75k6ev68ved6nujcspt47dgvkp8euc70s6uegk6',
            },
            dustThreshold: 0,
            feeRate: '10',
            outputs: [
                {
                    address: 'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    ...UTXO,
                    amount: '102000',
                },
            ],
        },
        result: {
            bytes: 154,
            fee: '1540',
            feePerByte: '10',
            max: undefined,
            totalSpent: '101540',
            inputs: [{ ...UTXO, amount: '102000' }],
            outputs: [
                {
                    address: 'bc1pgypgja2hmcx2l6s2ssq75k6ev68ved6nujcspt47dgvkp8euc70s6uegk6',
                    amount: '460',
                    type: 'change',
                },
                {
                    address: 'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [1, 0],
            type: 'final',
        },
    },
    {
        description: 'builds a send-max-noaddress',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    type: 'send-max-noaddress',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 192,
            fee: '1920',
            feePerByte: '10',
            max: '100081',
            totalSpent: '102001',
            type: 'nonfinal',
            inputs: [UTXO],
        },
    },
    {
        description: 'builds a simple tx without change (cashaddr)',
        request: {
            changeAddress: { address: 'bitcoincash:qzppkat2v7xu9fr3yeuqdnggjqqltrs7pcg8swvhl0' },
            network: 'bitcoincash',
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: 'bitcoincash:qp6e6enhpy0fwwu7nkvlr8rgl06ru0c9lywalz8st5',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [UTXO],
        },
        result: {
            bytes: 192,
            fee: '2001',
            feePerByte: '10.421875',
            max: undefined,
            totalSpent: '102001',
            inputs: [UTXO],
            outputs: [
                {
                    address: 'bitcoincash:qp6e6enhpy0fwwu7nkvlr8rgl06ru0c9lywalz8st5',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [0],
            type: 'final',
        },
    },
    {
        description: 'use required (coinbase + unconfirmed) instead of more suitable utxo',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    vout: 0,
                    txid: 'a4dc0ffeee',
                    amount: '65291',
                    coinbase: true,
                    confirmations: 200,
                    own: false,
                    required: true,
                },
                {
                    vout: 0,
                    txid: 'c4dc0ffeee',
                    amount: '202001',
                    coinbase: false,
                    confirmations: 150,
                    own: true,
                },
                {
                    vout: 0,
                    txid: 'b4dc0ffeee',
                    amount: '55291',
                    coinbase: false,
                    confirmations: 0,
                    own: false,
                    required: true,
                },
                {
                    vout: 0,
                    txid: 'd4dc0ffeee',
                    amount: '200000',
                    coinbase: false,
                    confirmations: 1000,
                    own: true,
                },
            ],
        },
        result: {
            bytes: 374,
            fee: '3740',
            feePerByte: '10',
            max: undefined,
            totalSpent: '103740',
            inputs: [
                {
                    txid: 'a4dc0ffeee',
                    vout: 0,
                    amount: '65291',
                    coinbase: true,
                    confirmations: 200,
                    own: false,
                    required: true,
                },
                {
                    txid: 'b4dc0ffeee',
                    vout: 0,
                    amount: '55291',
                    coinbase: false,
                    confirmations: 0,
                    own: false,
                    required: true,
                },
            ],
            outputs: [
                {
                    amount: '16842',
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    type: 'change',
                },
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '100000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [1, 0],
            type: 'final',
        },
    },
    {
        description: 'skip inputs/outputs permutation',
        request: {
            changeAddress: { address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT' },
            dustThreshold: 546,
            feeRate: '10',
            skipPermutation: true,
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '70000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    txid: 'a4dc0ffeee',
                    vout: 0,
                    amount: '65291',
                    coinbase: false,
                    confirmations: 60,
                    own: false,
                },
                {
                    txid: 'b4dc0ffeee',
                    vout: 1,
                    amount: '55291',
                    coinbase: false,
                    confirmations: 50,
                    own: false,
                },
            ],
        },
        result: {
            bytes: 374,
            fee: '3740',
            feePerByte: '10',
            max: undefined,
            totalSpent: '73740',
            inputs: [
                {
                    txid: 'a4dc0ffeee',
                    vout: 0,
                    amount: '65291',
                    coinbase: false,
                    confirmations: 60,
                    own: false,
                },
                {
                    txid: 'b4dc0ffeee',
                    vout: 1,
                    amount: '55291',
                    coinbase: false,
                    confirmations: 50,
                    own: false,
                },
            ],
            outputs: [
                {
                    address: '1BitcoinEaterAddressDontSendf59kuE',
                    amount: '70000',
                    type: 'payment',
                },
                {
                    amount: '46842',
                    address: '1CrwjoKxvdbAnPcGzYjpvZ4no4S71neKXT',
                    type: 'change',
                },
            ],
            outputsPermutation: [0, 1],
            type: 'final',
        },
    },
    {
        description:
            'builds a Dogecoin tx with change and both input and one of the outputs above MAX_SAFE_INTEGER',
        request: {
            changeAddress: { address: 'DKu2a8Wo6zC2dmBBYXwUG3fxWDHbKnNiPj' },
            dustThreshold: 999999,
            feeRate: '1000',
            network: 'doge',
            outputs: [
                {
                    address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                    amount: '11556856849999734000',
                    type: 'payment',
                },
            ],
            utxos: [
                {
                    coinbase: false,
                    confirmations: 2272181,
                    vout: 1,
                    own: false,
                    txid: '78c3ee88226c7f63060fbf27ab0450961c09241bfd56a12ce164881791c7c6e5',
                    amount: '11556856856800000000',
                },
            ],
        },
        result: {
            bytes: 226,
            fee: '226000',
            feePerByte: '1000',
            max: undefined,
            totalSpent: '11556856849999960000',
            inputs: [
                {
                    coinbase: false,
                    confirmations: 2272181,
                    vout: 1,
                    own: false,
                    txid: '78c3ee88226c7f63060fbf27ab0450961c09241bfd56a12ce164881791c7c6e5',
                    amount: '11556856856800000000',
                },
            ],
            outputs: [
                {
                    address: 'DKu2a8Wo6zC2dmBBYXwUG3fxWDHbKnNiPj',
                    amount: '6800040000',
                    type: 'change',
                },
                {
                    address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                    amount: '11556856849999734000',
                    type: 'payment',
                },
            ],
            outputsPermutation: [1, 0],
            type: 'final',
        },
    },
];
