import type { TokenTransfer } from '@trezor/blockchain-link';
import type { TokenDefinitions, WalletAccountTransaction } from '@suite-common/wallet-types';

export const getIsZeroValuePhishingFixtures = [
    {
        testName: 'detects potential zero-value phishing transactions',
        transaction: {
            amount: '0',
            tokens: [
                { amount: '0' } as TokenTransfer,
                { amount: '0' } as TokenTransfer,
                { amount: '0' } as TokenTransfer,
            ],
        } as WalletAccountTransaction,
        result: true,
    },
    {
        testName: 'detects non-zero value transaction',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0' } as TokenTransfer, { amount: '0.00132342' } as TokenTransfer],
        } as WalletAccountTransaction,
        result: false,
    },
    {
        testName: 'transaction with zero ETH and mixed token values',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0' } as TokenTransfer, { amount: '1.23' } as TokenTransfer],
        } as WalletAccountTransaction,
        result: false,
    },
    {
        testName: 'transaction with non-zero ETH and zero-value tokens',
        transaction: {
            amount: '1',
            tokens: [{ amount: '0' } as TokenTransfer],
        } as WalletAccountTransaction,
        result: false,
    },
    {
        testName: 'transaction with zero ETH and no tokens',
        transaction: {
            amount: '0',
            tokens: [],
        } as unknown as WalletAccountTransaction,
        result: false,
    },
    {
        testName: 'transaction with non-zero ETH and no tokens',
        transaction: {
            amount: '1',
            tokens: [],
        } as unknown as WalletAccountTransaction,
        result: false,
    },
];

export const getIsFakeTokenPhishingFixtures = [
    {
        testName: 'non-zero tx',
        transaction: {
            amount: '1.23',
            tokens: [{ standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'only fake tokens tx',
        transaction: {
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: false, isLoading: false, error: false },
            '0xB': { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'one fake, one legit token tx',
        transaction: {
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: true, isLoading: false, error: false },
            '0xB': { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'only legit tokens tx',
        transaction: {
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: true, isLoading: false, error: false },
            '0xB': { isTokenKnown: true, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'no tokens tx',
        transaction: {
            amount: '0',
            tokens: [],
        } as unknown as WalletAccountTransaction,
        tokenDefinitions: {} as TokenDefinitions,
        result: false,
    },
    {
        testName: 'NFT token with fake token tx',
        transaction: {
            amount: '0',
            tokens: [
                { standard: 'ERC1155', contract: '0xN' },
                { standard: 'ERC20', contract: '0xA' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'just NFT token tx',
        transaction: {
            amount: '0',
            tokens: [{ standard: 'ERC721', contract: '0xN' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {} as TokenDefinitions,
        result: false,
    },
];

export const getIsPhishingTransactionFixtures = [
    {
        testName: 'legit tx with known token',
        transaction: {
            amount: '1',
            tokens: [{ amount: '1', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: true, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'zero value phishing tx',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: true, isLoading: false, error: false },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'fake token tx',
        transaction: {
            amount: '1',
            tokens: [{ amount: '5', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'NFT token tx',
        transaction: {
            amount: '1',
            tokens: [{ amount: '0', standard: 'ERC1155', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xB': { isTokenKnown: true, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'fake tx with fake token',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            '0xA': { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'solana fake tx',
        transaction: {
            amount: '0',
            tokens: [{ amount: '1', standard: 'SPL', contract: 'AAA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            AAA: { isTokenKnown: false, isLoading: false, error: false },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'solana legit tx',
        transaction: {
            amount: '0',
            tokens: [{ amount: '1', standard: 'SPL', contract: 'AAA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            AAA: { isTokenKnown: true, isLoading: false, error: false },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'no token definitions available for this network',
        transaction: {
            amount: '1',
            tokens: [{ amount: '1', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {} as TokenDefinitions,
        result: false,
    },
    // Additional test cases here, if necessary
];
