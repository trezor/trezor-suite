export const prepareEthereumTransaction = [
    {
        description: 'regular',
        txInfo: {
            to: '0x1f815D67006163E502b8eD4947C91ad0A62De24e',
            amount: '1',
            chainId: 1,
            nonce: '2',
            gasLimit: '21000',
            gasPrice: '1',
            data: 'deadbeef',
        },
        result: {
            to: '0x1f815D67006163E502b8eD4947C91ad0A62De24e',
            value: '0xde0b6b3a7640000',
            chainId: 1,
            nonce: '0x2',
            gasLimit: '0x5208',
            gasPrice: '0x3b9aca00',
            data: '0xdeadbeef',
        },
    },
    {
        // https://eth.trezor.io/tx/0xdcaf3eba690a3cdbad8c2926a8f5a95cd20003c5ba2aace91d8c5fe8048e395b
        description: 'erc20',
        txInfo: {
            token: {
                standard: 'ERC20' as const,
                symbol: 'gnt',
                decimals: 18,
                contract: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
                name: 'GNT',
            },
            to: '0xA6ABB480640d6D27D2FB314196D94463ceDcB31e',
            amount: '0.005',
            chainId: 1,
            nonce: '11',
            gasLimit: '200000',
            gasPrice: '5',
        },
        result: {
            to: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
            value: '0x00',
            chainId: 1,
            nonce: '0xb',
            gasLimit: '0x30d40',
            gasPrice: '0x12a05f200',
            data: '0xa9059cbb000000000000000000000000A6ABB480640d6D27D2FB314196D94463ceDcB31e0000000000000000000000000000000000000000000000000011c37937e08000',
        },
    },
    {
        description: 'regular with eip1559 fees',
        txInfo: {
            to: '0x1f815D67006163E502b8eD4947C91ad0A62De24e',
            amount: '1',
            chainId: 1,
            nonce: '2',
            gasLimit: '21000',
            gasPrice: '1',
            data: 'deadbeef',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        },
        result: {
            to: '0x1f815D67006163E502b8eD4947C91ad0A62De24e',
            value: '0xde0b6b3a7640000',
            chainId: 1,
            nonce: '0x2',
            gasLimit: '0x5208',
            gasPrice: undefined,
            data: '0xdeadbeef',
            maxFeePerGas: '0x3b9aca00',
            maxPriorityFeePerGas: '0x1dcd6500',
        },
    },
    {
        description: 'erc20 with eip1559 fees',
        txInfo: {
            token: {
                standard: 'ERC20' as const,
                symbol: 'gnt',
                decimals: 18,
                contract: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
                name: 'GNT',
            },
            to: '0xA6ABB480640d6D27D2FB314196D94463ceDcB31e',
            amount: '0.005',
            chainId: 1,
            nonce: '11',
            gasLimit: '200000',
            gasPrice: '5',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        },
        result: {
            to: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
            value: '0x00',
            chainId: 1,
            nonce: '0xb',
            gasLimit: '0x30d40',
            gasPrice: undefined,
            data: '0xa9059cbb000000000000000000000000A6ABB480640d6D27D2FB314196D94463ceDcB31e0000000000000000000000000000000000000000000000000011c37937e08000',
            maxFeePerGas: '0x3b9aca00',
            maxPriorityFeePerGas: '0x1dcd6500',
        },
    },
    {
        description: 'bep20 with eip1559 fees',
        txInfo: {
            token: {
                standard: 'BEP20' as const,
                symbol: 'ETH',
                decimals: 18,
                contract: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
                name: 'Binance-Peg Ethereum Token',
            },
            to: '0xA6ABB480640d6D27D2FB314196D94463ceDcB31e',
            amount: '0.005',
            chainId: 1,
            nonce: '11',
            gasLimit: '200000',
            gasPrice: '5',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        },
        result: {
            to: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
            value: '0x00',
            chainId: 1,
            nonce: '0xb',
            gasLimit: '0x30d40',
            gasPrice: undefined,
            data: '0xa9059cbb000000000000000000000000A6ABB480640d6D27D2FB314196D94463ceDcB31e0000000000000000000000000000000000000000000000000011c37937e08000',
            maxFeePerGas: '0x3b9aca00',
            maxPriorityFeePerGas: '0x1dcd6500',
        },
    },
    {
        description: 'erc721 safeTransferFrom — redirects to contract, emits correct calldata',
        txInfo: {
            token: {
                standard: 'ERC721' as const,
                symbol: 'NFT',
                decimals: 0,
                contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
                name: 'Bored Ape Yacht Club',
            },
            from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
            tokenId: '42',
            to: '0xA6ABB480640d6D27D2FB314196D94463ceDcB31e',
            amount: '1',
            chainId: 1,
            nonce: '5',
            gasLimit: '80000',
            maxFeePerGas: '1',
            maxPriorityFeePerGas: '0.5',
        },
        result: {
            to: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            value: '0x00',
            chainId: 1,
            nonce: '0x5',
            gasLimit: '0x13880',
            gasPrice: undefined,
            data: '0x42842e0e0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000a6abb480640d6d27d2fb314196d94463cedcb31e000000000000000000000000000000000000000000000000000000000000002a',
            maxFeePerGas: '0x3b9aca00',
            maxPriorityFeePerGas: '0x1dcd6500',
        },
    },
    {
        description: 'erc1155 safeTransferFrom — redirects to contract, emits correct calldata with empty bytes',
        txInfo: {
            token: {
                standard: 'ERC1155' as const,
                symbol: 'ITEM',
                decimals: 0,
                contract: '0x76BE3b62873462d2142405439777e971754E8E77',
                name: 'Parallel Alpha',
            },
            from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
            tokenId: '7',
            to: '0xA6ABB480640d6D27D2FB314196D94463ceDcB31e',
            amount: '5',
            chainId: 1,
            nonce: '3',
            gasLimit: '100000',
            gasPrice: '5',
        },
        result: {
            to: '0x76BE3b62873462d2142405439777e971754E8E77',
            value: '0x00',
            chainId: 1,
            nonce: '0x3',
            gasLimit: '0x186a0',
            gasPrice: '0x12a05f200',
            data: '0xf242432a0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3000000000000000000000000a6abb480640d6d27d2fb314196d94463cedcb31e0000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000',
        },
    },
];

export const restoreOrigOutputsOrder = [
    {
        description: 'order not changed',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
        origOutputs: [
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                address_n: [],
                amount: '2',
                orig_index: 1,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description: 'order not changed: change-output is removed',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
        ],
        origOutputs: [
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 0,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description:
            'order changed: change-output is added on index 0, two external outputs with the same address',
        outputs: [
            {
                address_n: [],
                amount: '2',
            },
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address: 'ABCD',
                amount: '3',
            },
        ],
        origOutputs: [
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '3',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                address: 'ABCD',
                amount: '3',
                orig_index: 1,
                orig_hash: 'txid',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
    },
    {
        description: 'order changed: change-output removed from index 0',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
        ],
        origOutputs: [
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 1,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description: 'order changed: change-output added on last position',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
        origOutputs: [
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
        ],
        result: [
            {
                address_n: [],
                amount: '2',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 1,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description: 'order changed: chaotic outputs mix',
        outputs: [
            {
                script_type: 'PAYTOOPRETURN',
                op_return_data: 'AA',
                amount: '0',
            },
            {
                address: 'DCBA',
                amount: '3',
            },
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address: 'DEAD',
                amount: '4',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
        origOutputs: [
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
            {
                type: 'opreturn',
                dataHex: 'AA',
                dataAscii: 'AA',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
        ],
        result: [
            {
                address_n: [],
                amount: '2',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                script_type: 'PAYTOOPRETURN',
                op_return_data: 'AA',
                amount: '0',
                orig_index: 1,
                orig_hash: 'txid',
            },
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 2,
                orig_hash: 'txid',
            },
            {
                address: 'DCBA',
                amount: '3',
            },
            {
                address: 'DEAD',
                amount: '4',
            },
        ],
    },
];
