import { type CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type Rate,
    type RatesByKey,
    asAccountDescriptor,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { aggregateTradeableAssetBalances } from './tradeableAssetBalanceUtils';

const ETH_CRYPTO_ID = 'ethereum' as CryptoId;
const USDC_CONTRACT = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const USDC_CRYPTO_ID = `ethereum--${USDC_CONTRACT}` as CryptoId;

const createRate = (rate: number, symbol: NetworkSymbol): Rate => ({
    rate,
    lastTickerTimestamp: asTimestamp(1_000_000),
    lastSuccessfulFetchTimestamp: asTimestamp(1_000_000),
    isLoading: false,
    error: null,
    ticker: { symbol },
});

const createEthAccount = (descriptor: string, account: Partial<Account> = {}): Account =>
    mockWalletAccount({
        symbol: 'eth',
        descriptor: asAccountDescriptor(descriptor),
        formattedBalance: '0',
        tokens: [],
        ...account,
    });

const ratesInUsd: RatesByKey = {
    [getFiatRateKey('eth', 'usd')]: createRate(2_000, 'eth'),
    [getFiatRateKey('eth', 'usd', USDC_CONTRACT)]: createRate(1, 'eth'),
};

describe('aggregateTradeableAssetBalances', () => {
    it('sums native and token balances of all accounts of the same network', () => {
        const balances = aggregateTradeableAssetBalances({
            accounts: [
                createEthAccount('firstEthAccount', {
                    formattedBalance: '1',
                    tokens: [
                        mockAccountToken({
                            symbol: 'USDC',
                            contract: USDC_CONTRACT,
                            balance: '1.5',
                        }),
                    ],
                }),
                createEthAccount('secondEthAccount', {
                    formattedBalance: '2',
                    tokens: [
                        mockAccountToken({
                            // The same token reported with a checksummed contract address
                            symbol: 'USDC',
                            contract: toTokenAddress(USDC_CONTRACT.toUpperCase()),
                            balance: '2.5',
                        }),
                    ],
                }),
            ],
            fiatRates: ratesInUsd,
            baseCurrency: 'usd',
        });

        expect(balances.get(ETH_CRYPTO_ID)?.cryptoAmount).toBe('3');
        expect(balances.get(ETH_CRYPTO_ID)?.fiatAmount?.toString()).toBe('6000');
        expect(balances.get(USDC_CRYPTO_ID)?.cryptoAmount).toBe('4');
        expect(balances.get(USDC_CRYPTO_ID)?.fiatAmount?.toString()).toBe('4');
    });

    it('skips assets without a positive balance', () => {
        const balances = aggregateTradeableAssetBalances({
            accounts: [
                createEthAccount('emptyEthAccount', {
                    tokens: [
                        mockAccountToken({ symbol: 'USDC', contract: USDC_CONTRACT, balance: '0' }),
                    ],
                }),
            ],
            fiatRates: ratesInUsd,
            baseCurrency: 'usd',
        });

        expect(balances.size).toBe(0);
    });

    it('returns a null fiat amount when the rate is missing', () => {
        const balances = aggregateTradeableAssetBalances({
            accounts: [createEthAccount('ethAccount', { formattedBalance: '1' })],
            fiatRates: undefined,
            baseCurrency: 'usd',
        });

        expect(balances.get(ETH_CRYPTO_ID)?.cryptoAmount).toBe('1');
        expect(balances.get(ETH_CRYPTO_ID)?.fiatAmount).toBeNull();
    });
});
