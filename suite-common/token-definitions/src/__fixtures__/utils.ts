import { NetworkSymbol } from '@suite-common/wallet-config';

import { DefinitionType } from '../tokenDefinitionsTypes';

export const isTokenDefinitionKnownFixtures = [
    {
        testName: 'Token definition known, case-insensitive network',
        tokenDefinitions: ['0xa', '0xb'],
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0xA',
        result: true,
    },
    {
        testName: 'Token definition unknown, case-sensitive network',
        tokenDefinitions: ['0xa', '0xb'],
        networkSymbol: 'sol' as NetworkSymbol,
        contractAddress: '0xA',
        result: false,
    },
    {
        testName: 'Token definition known, case-sensitive network',
        tokenDefinitions: ['0xA', '0xb'],
        networkSymbol: 'sol' as NetworkSymbol,
        contractAddress: '0xA',
        result: true,
    },
    {
        testName: 'Token definition not known',
        tokenDefinitions: ['0xa', '0xb'],
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0xC',
        result: false,
    },
    {
        testName: 'Token definitions are undefined',
        tokenDefinitions: undefined,
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0xA',
        result: false,
    },
];

export const getSupportedDefinitionTypesFixtures = [
    {
        testName: 'Supports both token and NFT definitions',
        networkSymbol: 'eth' as NetworkSymbol,
        features: ['coin-definitions', 'nft-definitions'],
        result: [DefinitionType.COIN, DefinitionType.NFT],
    },
    // Temporarily skipped while token definitions are disabled for Cardano.
    // {
    //     testName: 'Supports only token definitions',
    //     networkSymbol: 'ada' as NetworkSymbol,
    //     features: ['coin-definitions'],
    //     result: [DefinitionType.COIN],
    // },
    {
        testName: 'Supports neither token nor NFT definitions',
        networkSymbol: 'ltc' as NetworkSymbol,
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
