import type { TokenTransfer } from '@trezor/blockchain-link';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { TokenDefinitions } from '@suite-common/token-definitions';

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
            symbol: 'matic',
            amount: '1.23',
            tokens: [{ standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'only fake tokens tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xC' },
                { standard: 'ERC20', contract: '0xD' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'one fake, one legit token tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'only legit tokens tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'no tokens tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [],
        } as unknown as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'legit NFT token with fake token tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [
                { standard: 'ERC1155', contract: '0xN' },
                { standard: 'ERC20', contract: '0xC' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'fake NFT token with legit token tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [
                { standard: 'ERC1155', contract: '0xT' },
                { standard: 'ERC20', contract: '0xA' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'just legit NFT token tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [{ standard: 'ERC721', contract: '0xN' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'just fake NFT token tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [
                { standard: 'ERC721', contract: '0xT' },
                { standard: 'ERC721', contract: '0xZ' },
            ],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'solana fake token tx',
        transaction: {
            symbol: 'sol',
            amount: '0',
            tokens: [{ standard: 'SPL', contract: 'AAA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['aaa'],
            },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'solana legit token tx',
        transaction: {
            symbol: 'sol',
            amount: '0',
            tokens: [{ standard: 'SPL', contract: 'AAA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['AAA'],
            },
        } as TokenDefinitions,
        result: false,
    },
];

export const getIsPhishingTransactionFixtures = [
    {
        testName: 'legit tx with known token',
        transaction: {
            symbol: 'matic',
            amount: '1',
            tokens: [{ amount: '1', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'zero value phishing tx',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [{ amount: '0', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'fake token tx',
        transaction: {
            symbol: 'matic',
            amount: '1',
            tokens: [{ amount: '5', standard: 'ERC20', contract: '0xC' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'NFT token tx',
        transaction: {
            symbol: 'matic',
            amount: '1',
            tokens: [{ amount: '0', standard: 'ERC1155', contract: '0xN' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'fake tx with fake token',
        transaction: {
            symbol: 'matic',
            amount: '0',
            tokens: [{ amount: '0', standard: 'ERC20', contract: '0xC' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xa', '0xb'],
            },
            nft: {
                error: false,
                isLoading: false,
                data: ['0xn', '0xf'],
            },
        } as TokenDefinitions,
        result: true,
    },
    {
        testName: 'solana fake tx (solana disabled)',
        transaction: {
            symbol: 'sol',
            amount: '0',
            tokens: [{ amount: '1', standard: 'SPL', contract: 'AAA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['aaa'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'solana legit tx (solana disabled)',
        transaction: {
            symbol: 'sol',
            amount: '0',
            tokens: [{ amount: '1', standard: 'SPL', contract: 'AAA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['AAA'],
            },
        } as TokenDefinitions,
        result: false,
    },
    {
        testName: 'no token definitions available for this network',
        transaction: {
            symbol: 'btc',
            amount: '1',
            tokens: [{ amount: '1', standard: 'ERC20', contract: '0xA' }],
        } as WalletAccountTransaction,
        tokenDefinitions: {} as TokenDefinitions,
        result: false,
    },
];
