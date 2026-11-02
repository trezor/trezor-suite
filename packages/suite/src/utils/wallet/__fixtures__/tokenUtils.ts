import { type TokenDefinition } from '@suite-common/token-definitions';
import { type TokenInfo } from '@trezor/connect';

export const getTokensFixtures = [
    {
        testName: 'tokens with definitions and balance',
        tokens: [
            { contract: '0x1', balance: '100' } as TokenInfo,
            { contract: '0x2', balance: '200' } as TokenInfo,
        ],
        symbol: 'eth' as const,
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
                { contract: '0x1', balance: '100' } as TokenInfo,
                { contract: '0x2', balance: '200' } as TokenInfo,
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
            { contract: '0x1', balance: '100' } as TokenInfo,
            { contract: '0x2', balance: '200' } as TokenInfo,
            { contract: '0x3', balance: '0' } as TokenInfo,
        ],
        symbol: 'eth' as const,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1', '0x2', '0x3'],
            hide: ['0x2'],
            show: [],
        } as TokenDefinition,
        searchQuery: '',
        result: {
            shownWithBalance: [{ contract: '0x1', balance: '100' } as TokenInfo],
            shownWithoutBalance: [{ contract: '0x3', balance: '0' } as TokenInfo],
            hiddenWithBalance: [{ contract: '0x2', balance: '200' } as TokenInfo],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [],
        },
    },
    {
        testName: 'unverified tokens with legit token',
        tokens: [
            { contract: '0x1', balance: '100' } as TokenInfo,
            { contract: '0x2', balance: '200' } as TokenInfo,
            { contract: '0x3', balance: '0' } as TokenInfo,
        ],
        symbol: 'eth' as const,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1'],
            hide: [],
            show: [],
        } as TokenDefinition,
        searchQuery: '',
        result: {
            shownWithBalance: [{ contract: '0x1', balance: '100' } as TokenInfo],
            shownWithoutBalance: [],
            hiddenWithBalance: [],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [{ contract: '0x2', balance: '200' } as TokenInfo],
            unverifiedWithoutBalance: [{ contract: '0x3', balance: '0' } as TokenInfo],
        },
    },
    {
        testName: 'mix of shown, hidden, and unverified tokens',
        tokens: [
            { contract: '0x1', balance: '100' } as TokenInfo,
            { contract: '0x2', balance: '200' } as TokenInfo,
            { contract: '0x3', balance: '300' } as TokenInfo,
            { contract: '0x4', balance: '0' } as TokenInfo,
            { contract: '0x5', balance: '0' } as TokenInfo,
        ],
        symbol: 'eth' as const,
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
                { contract: '0x1', balance: '100' } as TokenInfo,
                { contract: '0x3', balance: '300' } as TokenInfo,
            ],
            shownWithoutBalance: [],
            hiddenWithBalance: [{ contract: '0x2', balance: '200' } as TokenInfo],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [
                { contract: '0x4', balance: '0' } as TokenInfo,
                { contract: '0x5', balance: '0' } as TokenInfo,
            ],
        },
    },
    {
        testName: 'legitokens search',
        tokens: [
            { contract: '0x1', balance: '100', symbol: 'ABC' } as TokenInfo,
            { contract: '0x2', balance: '200', symbol: 'DEF' } as TokenInfo,
            { contract: '0x3', balance: '0', symbol: 'GHI' } as TokenInfo,
        ],
        symbol: 'eth' as const,
        coinDefinitions: {
            error: false,
            isLoading: false,
            data: ['0x1', '0x2', '0x3'],
            hide: [],
            show: [],
        } as TokenDefinition,
        searchQuery: 'AB',
        result: {
            shownWithBalance: [{ contract: '0x1', balance: '100', symbol: 'ABC' } as TokenInfo],
            shownWithoutBalance: [],
            hiddenWithBalance: [],
            hiddenWithoutBalance: [],
            unverifiedWithBalance: [],
            unverifiedWithoutBalance: [],
        },
    },
];
