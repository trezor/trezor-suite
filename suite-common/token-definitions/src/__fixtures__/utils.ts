import { NetworkSymbol } from '@suite-common/wallet-config';

import { DefinitionType } from '../types';

export const caseContractAddressForNetworkFixtures = [
    {
        testName: 'Converts to lowercase for non-sol networks',
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0xABCD',
        expected: '0xabcd',
    },
    {
        testName: 'Preserves case for sol network',
        networkSymbol: 'sol' as NetworkSymbol,
        contractAddress: 'SolContractAddress',
        expected: 'SolContractAddress',
    },
    {
        testName: 'Converts to lowercase for eth network',
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0XABCDE',
        expected: '0xabcde',
    },
    {
        testName: 'Handles empty contract address for non-sol network',
        networkSymbol: 'btc' as NetworkSymbol,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Handles empty contract address for sol network',
        networkSymbol: 'sol' as NetworkSymbol,
        contractAddress: '',
        expected: '',
    },
];

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
