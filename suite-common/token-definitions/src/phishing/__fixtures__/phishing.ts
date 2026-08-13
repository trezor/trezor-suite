import type {
    RatesByTimestamps,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import type { TokenDefinitions } from '../../tokenDefinitionsTypes';
import { DUST_PHISHING_THRESHOLD, DUST_PHISHING_THRESHOLD_CURRENCY } from '../constants';
import { type TransactionWithFiatAmount } from '../types';

const DUST_UNIT = new BigNumber(DUST_PHISHING_THRESHOLD).dividedBy(10);
const EXACT_DUST = DUST_PHISHING_THRESHOLD;
const BELOW_DUST = new BigNumber(DUST_PHISHING_THRESHOLD).minus(DUST_UNIT).toString();
const ABOVE_DUST = new BigNumber(DUST_PHISHING_THRESHOLD).plus(DUST_UNIT).toString();

export const isDustValuePhishingFixtures = [
    {
        testName: 'transaction with exact-dust native token and no tokens',
        transaction: {
            amountInFiat: EXACT_DUST,
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with below-dust native token and no tokens',
        transaction: {
            amountInFiat: BELOW_DUST,
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with above-dust native token and no tokens',
        transaction: {
            amountInFiat: ABOVE_DUST,
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with zero native token and one exact-dust token',
        transaction: {
            amountInFiat: '0',
            tokens: [{ amountInFiat: EXACT_DUST }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with zero native token and one below-dust token',
        transaction: {
            amountInFiat: '0',
            tokens: [{ amountInFiat: BELOW_DUST }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with zero native token and one above-dust token',
        transaction: {
            amountInFiat: '0',
            tokens: [{ amountInFiat: ABOVE_DUST }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with zero native token and exact-dust tokens',
        transaction: {
            amountInFiat: '0',
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).toString(),
                },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with zero native token and below-dust tokens',
        transaction: {
            amountInFiat: '0',
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST)
                        .dividedBy(2)
                        .minus(DUST_UNIT)
                        .toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).toString(),
                },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with zero native token and above-dust tokens',
        transaction: {
            amountInFiat: '0',
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).plus(DUST_UNIT).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).toString(),
                },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with native token and tokens (exact-dust)',
        transaction: {
            amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).toString(),
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(4).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(4).toString(),
                },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with native token and tokens (below-dust)',
        transaction: {
            amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).minus(DUST_UNIT).toString(),
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(4).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(4).toString(),
                },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with native token and tokens (above-dust)',
        transaction: {
            amountInFiat: new BigNumber(EXACT_DUST).dividedBy(2).plus(DUST_UNIT).toString(),
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(4).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(4).toString(),
                },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with native token and tokens and internal transfers (exact-dust)',
        transaction: {
            amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
                },
            ],
            internalTransfers: [
                { amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString() },
                { amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString() },
            ],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with native token and tokens and internal transfers (below-dust)',
        transaction: {
            amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).minus(DUST_UNIT).toString(),
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
                },
            ],
            internalTransfers: [
                { amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString() },
                { amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString() },
            ],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'transaction with native token and tokens and internal transfers (above-dust)',
        transaction: {
            amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).plus(DUST_UNIT).toString(),
            tokens: [
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
                },
                {
                    amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString(),
                },
            ],
            internalTransfers: [
                { amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString() },
                { amountInFiat: new BigNumber(EXACT_DUST).dividedBy(5).toString() },
            ],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with zero native token and zero tokens',
        transaction: {
            amountInFiat: '0',
            tokens: [{ amountInFiat: '0' }, { amountInFiat: '0' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
];

export const isZeroValuePhishingFixtures = [
    {
        testName: 'detects potential zero-value phishing transactions',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0' }, { amount: '0' }, { amount: '0' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
    {
        testName: 'detects non-zero value transaction',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0' }, { amount: '0.00132342' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with zero ETH and mixed token values',
        transaction: {
            amount: '0',
            tokens: [{ amount: '0' }, { amount: '1.23' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with non-zero ETH and zero-value tokens',
        transaction: {
            amount: '1',
            tokens: [{ amount: '0' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with zero ETH and no tokens',
        transaction: {
            amount: '0',
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'transaction with non-zero ETH and no tokens',
        transaction: {
            amount: '1',
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
];

export const isFakeTokenPhishingFixtures = [
    {
        testName: 'non-zero tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '1.23',
            tokens: [{ standard: 'ERC20', contract: '0xA' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xC' },
                { standard: 'ERC20', contract: '0xD' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'only zero-value fake tokens tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xC', amount: '0' },
                { standard: 'ERC20', contract: '0xD', amount: '0' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'one fake, one zero-value legit token tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA', amount: '1' },
                { standard: 'ERC20', contract: '0xB', amount: '0' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xb'],
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
        testName: 'one zero-value fake, one legit token tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA', amount: '0' },
                { standard: 'ERC20', contract: '0xB', amount: '1' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        tokenDefinitions: {
            coin: {
                error: false,
                isLoading: false,
                data: ['0xb'],
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
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA' },
                { standard: 'ERC20', contract: '0xB' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'only legit tokens tx',
        transaction: {
            type: 'sent',
            symbol: 'bsc',
            amount: '0',
            tokens: [
                { standard: 'BEP20', contract: '0xA' },
                { standard: 'BEP20', contract: '0xB' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'only zero-value legit tokens tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC20', contract: '0xA', amount: '0' },
                { standard: 'ERC20', contract: '0xB', amount: '0' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'no tokens tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC1155', contract: '0xN' },
                { standard: 'ERC20', contract: '0xC' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC1155', contract: '0xT' },
                { standard: 'ERC20', contract: '0xA' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'fake NFT token with zero-value legit token tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC1155', contract: '0xT', amount: '1' },
                { standard: 'ERC20', contract: '0xA', amount: '0' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'just legit NFT token tx',
        transaction: {
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [{ standard: 'ERC721', contract: '0xN' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'pol',
            amount: '0',
            tokens: [
                { standard: 'ERC721', contract: '0xT' },
                { standard: 'ERC721', contract: '0xZ' },
            ],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'sol',
            amount: '0',
            tokens: [{ standard: 'SPL', contract: 'AAA' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            type: 'sent',
            symbol: 'sol',
            amount: '0',
            tokens: [{ standard: 'SPL', contract: 'AAA' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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

export const isUnknownTxPhishingFixtures = [
    {
        testName: 'known transaction',
        transaction: {
            type: 'recv',
            symbol: 'eth',
            amount: '1',
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: false,
    },
    {
        testName: 'unknown transaction',
        transaction: {
            type: 'unknown',
            symbol: 'eth',
            amount: '1',
            tokens: [],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        result: true,
    },
];

export const isPhishingTransactionFixtures = [
    {
        testName: 'legit tx with known token',
        transaction: {
            symbol: 'pol',
            amount: '1',
            tokens: [{ amount: '1', standard: 'ERC20', contract: '0xA' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            symbol: 'pol',
            amount: '0',
            tokens: [{ amount: '0', standard: 'ERC20', contract: '0xA' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            symbol: 'pol',
            amount: '1',
            tokens: [{ amount: '5', standard: 'ERC20', contract: '0xC' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            symbol: 'pol',
            amount: '1',
            tokens: [{ amount: '0', standard: 'ERC1155', contract: '0xN' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            symbol: 'pol',
            amount: '0',
            tokens: [{ amount: '0', standard: 'ERC20', contract: '0xC' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
        testName: 'solana legit tx (solana disabled)',
        transaction: {
            symbol: 'sol',
            amount: '0',
            tokens: [{ amount: '1', standard: 'SPL', contract: 'AAA' }],
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
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
            internalTransfers: [],
        } as unknown as TransactionWithFiatAmount,
        tokenDefinitions: {} as TokenDefinitions,
        result: false,
    },
];

const CONTRACT = '0xA' as TokenAddress;
// on the hour, so roundTimestampToNearestPastHour is a no-op and the rate lookup below hits
const BLOCK_TIME = 1699999200 as Timestamp;

// 1 whole unit of the token is worth $10
const historicRates = {
    [getFiatRateKey('eth', DUST_PHISHING_THRESHOLD_CURRENCY, CONTRACT)]: { [BLOCK_TIME]: 10 },
} as unknown as RatesByTimestamps;

const transactionWithTokenDecimals = (decimals: number | undefined) =>
    ({
        symbol: 'eth',
        type: 'recv',
        amount: '0',
        blockTime: BLOCK_TIME,
        internalTransfers: [],
        tokens: [{ amount: '5', contract: CONTRACT, decimals }],
    }) as unknown as WalletAccountTransaction;

export const getTransactionWithFiatAmountsFixtures = [
    {
        // regression: `decimals: 0` used to be read as "missing" and replaced by the network's 18,
        // understating the amount by 10^18 and making a real transfer look like dust
        testName: 'decimals: 0 is treated as 0 decimals, not as missing',
        transaction: transactionWithTokenDecimals(0),
        historicRates,
        tokenAmountInFiat: '50', // 5 units * $10
    },
    {
        testName: 'missing decimals falls back to the network decimals',
        transaction: transactionWithTokenDecimals(undefined),
        historicRates,
        tokenAmountInFiat: '0.00000000000000005', // 5 wei * $10, using eth's 18 decimals
    },
    {
        testName: 'reported decimals are used as-is',
        transaction: transactionWithTokenDecimals(2),
        historicRates,
        tokenAmountInFiat: '0.5',
    },
];
