import { DefinitionType } from '../tokenDefinitionsTypes';

export const isTokenDefinitionKnownFixtures = [
    {
        testName: 'Token definition known, case-insensitive network',
        tokenDefinitions: ['0xa', '0xb'],
        symbol: 'eth' as const,
        contractAddress: '0xA',
        result: true,
    },
    {
        testName: 'Token definition unknown, case-sensitive network',
        tokenDefinitions: ['0xa', '0xb'],
        symbol: 'sol' as const,
        contractAddress: '0xA',
        result: false,
    },
    {
        testName: 'Token definition known, case-sensitive network',
        tokenDefinitions: ['0xA', '0xb'],
        symbol: 'sol' as const,
        contractAddress: '0xA',
        result: true,
    },
    {
        testName: 'Token definition not known',
        tokenDefinitions: ['0xa', '0xb'],
        symbol: 'eth' as const,
        contractAddress: '0xC',
        result: false,
    },
    {
        testName: 'Cardano asset is known by its policy id',
        tokenDefinitions: ['0691b2fecca1ac4f53cb6dfb00b7013e561d1f34403b957cbb5af1fa'],
        symbol: 'ada' as const,
        contractAddress: '0691b2fecca1ac4f53cb6dfb00b7013e561d1f34403b957cbb5af1fa4e49474854',
        result: true,
    },
    {
        testName: 'Cardano asset of an unlisted policy id is unknown',
        tokenDefinitions: ['0691b2fecca1ac4f53cb6dfb00b7013e561d1f34403b957cbb5af1fa'],
        symbol: 'ada' as const,
        contractAddress: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958',
        result: false,
    },
    {
        testName: 'Token definitions are undefined',
        tokenDefinitions: undefined,
        symbol: 'eth' as const,
        contractAddress: '0xA',
        result: false,
    },
];

export const getSupportedDefinitionTypesFixtures = [
    {
        testName: 'Supports both token and NFT definitions',
        symbol: 'eth' as const,
        features: ['coin-definitions', 'nft-definitions'],
        result: [DefinitionType.COIN, DefinitionType.NFT],
    },
    // Temporarily skipped while token definitions are disabled for Cardano.
    // {
    //     testName: 'Supports only token definitions',
    //     symbol: 'ada' as const,
    //     features: ['coin-definitions'],
    //     result: [DefinitionType.COIN],
    // },
    {
        testName: 'Supports neither token nor NFT definitions',
        symbol: 'ltc' as const,
        features: [],
        result: [],
    },
];

export const buildTokenDefinitionsFromStorageFixtures = [
    {
        testName: 'Builds token definitions from storage for eth network',
        storage: [
            {
                key: 'eth-coin-hide',
                value: ['0xA', '0xB'],
            },
            {
                key: 'eth-coin-show',
                value: ['0xC', '0xD'],
            },
            {
                key: 'eth-nft-hide',
                value: ['0xE', '0xF'],
            },
            {
                key: 'eth-nft-show',
                value: ['0xG', '0xH'],
            },
        ],
        result: {
            eth: {
                coin: {
                    error: false,
                    data: undefined,
                    isLoading: false,
                    hide: ['0xA', '0xB'],
                    show: ['0xC', '0xD'],
                },
                nft: {
                    error: false,
                    data: undefined,
                    isLoading: false,
                    hide: ['0xE', '0xF'],
                    show: ['0xG', '0xH'],
                },
            },
        },
    },
    {
        testName: 'Builds token definitions from storage for sol network',
        storage: [
            {
                key: 'sol-coin-hide',
                value: ['0xA', '0xB'],
            },
            {
                key: 'sol-coin-show',
                value: ['0xC', '0xD'],
            },
        ],
        result: {
            sol: {
                coin: {
                    error: false,
                    data: undefined,
                    isLoading: false,
                    hide: ['0xA', '0xB'],
                    show: ['0xC', '0xD'],
                },
                nft: {
                    error: false,
                    data: undefined,
                    isLoading: false,
                    hide: [],
                    show: [],
                },
            },
        },
    },
];
