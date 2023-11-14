
const sampleMintToDetailMap = {
    so11111111111111111111111111111111111111112: {
        name: 'Wrapped SOL',
        symbol: 'WSOL',
    },
    es9vmfrzacermJfrf4h2fyd4kconkY11mcce8benwnyb: {
        name: 'Tether',
        symbol: 'USDT',
    },
    '4k3dyjzvzp8emzwuxbbcjevwskkk59s5icnly3qrkx6r': {
        name: 'Raydium',
        symbol: 'RAY',
    },
};


export const fixtures = {
    getTokenNameAndSymbol: [
        {
            description: 'parses non-whitelist token data from mint',
            input: {
                mint: 'AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC5wajM',
                map: sampleMintToDetailMap,
            },
            expectedOutput: {
                name: 'AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC5wajM',
                symbol: 'AQo...',
            },
        },
        {
            description: 'parses whitelisted token data from mint',
            input: {
                mint: 'So11111111111111111111111111111111111111112',
                map: sampleMintToDetailMap,
            },
            expectedOutput: {
                name: 'Wrapped SOL',
                symbol: 'WSOL',
            },
        },
    ],
    transformTokenInfo: [
        {
            description: 'parses token info from token accounts api response',
            input: {
                accountInfo: tokenAccountInfo,
                map: sampleMintToDetailMap,
            },
            expectedOutput: [
                {
                    type: 'SPL',
                    contract: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                    balance: '2000000',
                    decimals: 6,
                    name: 'Raydium',
                    symbol: 'RAY',
                    accounts: [
                        {
                            balance: '2000000',
                            publicKey: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        },
                    ],
                },
            ],
        },
        {
            description:
                'parses token info for multiple token accounts with the same token from api response',
            input: {
                accountInfo: tokenAccountInfoWithDuplicateTokenAccount,
                map: sampleMintToDetailMap,
            },
            expectedOutput: [
                {
                    type: 'SPL',
                    contract: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                    balance: '3000000',
                    decimals: 6,
                    name: 'Raydium',
                    symbol: 'RAY',
                    accounts: [
                        {
                            balance: '2000000',
                            publicKey: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        },
                        {
                            balance: '1000000',
                            publicKey: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        },
                    ],
                },
            ],
        },
    ],
};
