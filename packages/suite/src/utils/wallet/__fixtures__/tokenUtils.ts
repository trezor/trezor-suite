import { EnhancedTokenInfo, TokenDefinition } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';

export const getTokensFixtures = [
    {
        testName: 'tokens with definitions and balance',
        tokens: [
            { contract: '0x1', balance: '100' } as EnhancedTokenInfo,
            { contract: '0x2', balance: '200' } as EnhancedTokenInfo,
        ],
        symbol: 'eth' as NetworkSymbol,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1', '0x2'],
            hide: [],
            show: [],
        } as TokenDefinition,
        searchQuery: '',
        result: {
            shownWithBalance: [
                { contract: '0x1', balance: '100' } as EnhancedTokenInfo,
                { contract: '0x2', balance: '200' } as EnhancedTokenInfo,
            ],
            shownWithoutBalance: [],
            hiddenWithBalance: [],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [],
        },
    },
    {
        testName: 'hidden token with legit tokens',
        tokens: [
            { contract: '0x1', balance: '100' } as EnhancedTokenInfo,
            { contract: '0x2', balance: '200' } as EnhancedTokenInfo,
            { contract: '0x3', balance: '0' } as EnhancedTokenInfo,
        ],
        symbol: 'eth' as NetworkSymbol,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1', '0x2', '0x3'],
            hide: ['0x2'],
            show: [],
        } as TokenDefinition,
        searchQuery: '',
        result: {
            shownWithBalance: [{ contract: '0x1', balance: '100' } as EnhancedTokenInfo],
            shownWithoutBalance: [{ contract: '0x3', balance: '0' } as EnhancedTokenInfo],
            hiddenWithBalance: [{ contract: '0x2', balance: '200' } as EnhancedTokenInfo],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [],
        },
    },
    {
        testName: 'unverified tokens with legit token',
        tokens: [
            { contract: '0x1', balance: '100' } as EnhancedTokenInfo,
            { contract: '0x2', balance: '200' } as EnhancedTokenInfo,
            { contract: '0x3', balance: '0' } as EnhancedTokenInfo,
        ],
        symbol: 'eth' as NetworkSymbol,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1'],
            hide: [],
            show: [],
        } as TokenDefinition,
        searchQuery: '',
        result: {
            shownWithBalance: [{ contract: '0x1', balance: '100' } as EnhancedTokenInfo],
            shownWithoutBalance: [],
            hiddenWithBalance: [],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [{ contract: '0x2', balance: '200' } as EnhancedTokenInfo],
            unverifiedWithoutBalance: [{ contract: '0x3', balance: '0' } as EnhancedTokenInfo],
        },
    },
    {
        testName: 'mix of shown, hidden, and unverified tokens',
        tokens: [
            { contract: '0x1', balance: '100' } as EnhancedTokenInfo,
            { contract: '0x2', balance: '200' } as EnhancedTokenInfo,
            { contract: '0x3', balance: '300' } as EnhancedTokenInfo,
            { contract: '0x4', balance: '0' } as EnhancedTokenInfo,
            { contract: '0x5', balance: '0' } as EnhancedTokenInfo,
        ],
        symbol: 'eth' as NetworkSymbol,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1', '0x2', '0x3'],
            hide: ['0x2'],
            show: ['0x3'],
        } as TokenDefinition,
        searchQuery: '',
        result: {
            shownWithBalance: [
                { contract: '0x1', balance: '100' } as EnhancedTokenInfo,
                { contract: '0x3', balance: '300' } as EnhancedTokenInfo,
            ],
            shownWithoutBalance: [],
            hiddenWithBalance: [{ contract: '0x2', balance: '200' } as EnhancedTokenInfo],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [
                { contract: '0x4', balance: '0' } as EnhancedTokenInfo,
                { contract: '0x5', balance: '0' } as EnhancedTokenInfo,
            ],
        },
    },
    {
        testName: 'legitokens search',
        tokens: [
            { contract: '0x1', balance: '100', symbol: 'ABC' } as EnhancedTokenInfo,
            { contract: '0x2', balance: '200', symbol: 'DEF' } as EnhancedTokenInfo,
            { contract: '0x3', balance: '0', symbol: 'GHI' } as EnhancedTokenInfo,
        ],
        symbol: 'eth' as NetworkSymbol,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1', '0x2', '0x3'],
            hide: [],
            show: [],
        } as TokenDefinition,
        searchQuery: 'AB',
        result: {
            shownWithBalance: [
                { contract: '0x1', balance: '100', symbol: 'ABC' } as EnhancedTokenInfo,
            ],
            shownWithoutBalance: [],
            hiddenWithBalance: [],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [],
        },
    },
];
