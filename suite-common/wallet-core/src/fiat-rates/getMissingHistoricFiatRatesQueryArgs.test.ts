import {
    type Account,
    type RatesByTimestamps,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { getMissingHistoricFiatRatesQueryArgs } from './getMissingHistoricFiatRatesQueryArgs';

const USD = 'usd' as BaseCurrencyCode;
const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const VAULT_CONTRACT = '0xbeef69b8fea9a16fb98a661860f6d78d94e1b000' as TokenAddress;
const HOUR_ALIGNED_TIMESTAMP = 1700002800 as Timestamp;
const NEXT_HOUR_TIMESTAMP = (HOUR_ALIGNED_TIMESTAMP + 3600) as Timestamp;

const ethAccount = {
    symbol: 'eth',
    tokens: [
        { contract: USDT_CONTRACT, decimals: 6 },
        { contract: VAULT_CONTRACT, decimals: 6, protocols: ['erc4626'] },
    ],
} as unknown as Account;

const tokenTransaction = (
    contract: TokenAddress,
    blockTime: number = HOUR_ALIGNED_TIMESTAMP,
): WalletAccountTransaction =>
    ({
        txid: `tx-${contract}-${blockTime}`,
        symbol: 'eth',
        blockTime,
        tokens: [{ contract, standard: 'ERC20', amount: '1000000', decimals: 6 }],
    }) as unknown as WalletAccountTransaction;

describe(getMissingHistoricFiatRatesQueryArgs.name, () => {
    it('asks for a missing token rate, but not for a known coin rate', () => {
        const historicFiatRates = {
            'eth-usd': { [HOUR_ALIGNED_TIMESTAMP]: 2000 },
        } as RatesByTimestamps;

        expect(
            getMissingHistoricFiatRatesQueryArgs({
                account: ethAccount,
                transactions: [tokenTransaction(USDT_CONTRACT)],
                historicFiatRates,
                baseCurrencyCode: USD,
            }),
        ).toEqual([
            {
                ticker: { symbol: 'eth', tokenAddress: USDT_CONTRACT },
                baseCurrencyCode: USD,
                timestamps: [HOUR_ALIGNED_TIMESTAMP],
            },
        ]);
    });

    it('does not ask for ERC4626 token rates', () => {
        const historicFiatRates = {
            'eth-usd': { [HOUR_ALIGNED_TIMESTAMP]: 2000 },
        } as RatesByTimestamps;

        expect(
            getMissingHistoricFiatRatesQueryArgs({
                account: ethAccount,
                transactions: [tokenTransaction(VAULT_CONTRACT)],
                historicFiatRates,
                baseCurrencyCode: USD,
            }),
        ).toEqual([]);
    });

    it('groups the missing hours of a ticker into one sorted query', () => {
        expect(
            getMissingHistoricFiatRatesQueryArgs({
                account: { ...ethAccount, tokens: [] },
                transactions: [
                    tokenTransaction(USDT_CONTRACT, NEXT_HOUR_TIMESTAMP + 60),
                    tokenTransaction(USDT_CONTRACT, HOUR_ALIGNED_TIMESTAMP + 60),
                    tokenTransaction(USDT_CONTRACT, HOUR_ALIGNED_TIMESTAMP + 120),
                ],
                historicFiatRates: {},
                baseCurrencyCode: USD,
            }),
        ).toEqual([
            {
                ticker: { symbol: 'eth' },
                baseCurrencyCode: USD,
                timestamps: [HOUR_ALIGNED_TIMESTAMP, NEXT_HOUR_TIMESTAMP],
            },
            {
                ticker: { symbol: 'eth', tokenAddress: USDT_CONTRACT },
                baseCurrencyCode: USD,
                timestamps: [HOUR_ALIGNED_TIMESTAMP, NEXT_HOUR_TIMESTAMP],
            },
        ]);
    });

    it('treats a zero rate as missing', () => {
        const historicFiatRates = {
            'eth-usd': { [HOUR_ALIGNED_TIMESTAMP]: 0 },
            [`eth-${USDT_CONTRACT}-usd`]: { [HOUR_ALIGNED_TIMESTAMP]: 1 },
        } as RatesByTimestamps;

        expect(
            getMissingHistoricFiatRatesQueryArgs({
                account: ethAccount,
                transactions: [tokenTransaction(USDT_CONTRACT)],
                historicFiatRates,
                baseCurrencyCode: USD,
            }).map(({ ticker }) => ticker),
        ).toEqual([{ symbol: 'eth' }]);
    });

    it('skips transactions without a block time and testnet accounts', () => {
        const pendingTransaction = {
            ...tokenTransaction(USDT_CONTRACT),
            blockTime: undefined,
        } as WalletAccountTransaction;

        expect(
            getMissingHistoricFiatRatesQueryArgs({
                account: ethAccount,
                transactions: [pendingTransaction],
                historicFiatRates: {},
                baseCurrencyCode: USD,
            }),
        ).toEqual([]);
        expect(
            getMissingHistoricFiatRatesQueryArgs({
                account: { ...ethAccount, symbol: 'test' } as Account,
                transactions: [tokenTransaction(USDT_CONTRACT)],
                historicFiatRates: {},
                baseCurrencyCode: USD,
            }),
        ).toEqual([]);
    });
});
