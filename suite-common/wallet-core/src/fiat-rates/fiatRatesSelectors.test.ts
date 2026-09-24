import { type DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type CryptoBaseCurrencyPair,
    type Rate,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';

import {
    selectCurrentFiatRatesByFiatRateKeys,
    selectHistoricFiatRatesByTimestamp,
    selectTickerFromAccounts,
} from './fiatRatesSelectors';
import { type FiatRatesRootState } from './fiatRatesTypes';
import { type AccountsRootState } from '../accounts/accountsReducer';

const STANDARD_WALLET_SSID = 'standardWallet@device_id:0' as const;
const STANDARD_WALLET = mockSuiteDevice({ state: { staticSessionId: STANDARD_WALLET_SSID } });

const PASSPHRASE_WALLET_SSID = 'passphraseWallet@device_id:0' as const;
const PASSPHRASE_WALLET = mockSuiteDevice({ state: { staticSessionId: PASSPHRASE_WALLET_SSID } });

const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const ethAccount = (deviceState: string, tokenContract: TokenAddress): Account =>
    ({
        symbol: 'eth',
        deviceState,
        tokens: [{ contract: tokenContract, balance: '1000000', protocols: [] }],
    }) as unknown as Account;

const xrpAccount = (deviceState: string): Account =>
    ({
        symbol: 'xrp',
        deviceState,
        tokens: [],
    }) as unknown as Account;

type State = FiatRatesRootState & TokenDefinitionsRootState & AccountsRootState & DeviceRootState;

const getState = (
    selectedDevice: TrezorDevice,
    accounts: Account[] = [
        ethAccount(STANDARD_WALLET_SSID, USDT),
        ethAccount(PASSPHRASE_WALLET_SSID, USDC),
    ],
): State =>
    ({
        wallet: {
            fiat: { current: {}, lastWeek: {}, historic: {} },
            accounts,
        },
        tokenDefinitions: {
            eth: { coin: { data: [USDT, USDC], error: false, isLoading: false } },
        },
        device: {
            devices: [STANDARD_WALLET, PASSPHRASE_WALLET],
            selectedDevice,
        },
    }) as unknown as State;

describe('selectTickerFromAccounts', () => {
    it('returns token tickers from all remembered wallets, not only the selected one', () => {
        const result = selectTickerFromAccounts(getState(STANDARD_WALLET));

        const tokenAddresses = result.map(ticker => ticker.tokenAddress).filter(Boolean);

        expect(tokenAddresses).toContain(USDT);
        expect(tokenAddresses).toContain(USDC);
    });

    it('returns the same token tickers regardless of which wallet is currently selected', () => {
        const fromStandard = selectTickerFromAccounts(getState(STANDARD_WALLET));
        const fromPassphrase = selectTickerFromAccounts(getState(PASSPHRASE_WALLET));

        const sortByKey = (tickers: typeof fromStandard) =>
            [...tickers].map(ticker => `${ticker.symbol}-${ticker.tokenAddress ?? ''}`).sort();

        expect(sortByKey(fromStandard)).toEqual(sortByKey(fromPassphrase));
    });

    it('orders all native coin tickers before token tickers', () => {
        const result = selectTickerFromAccounts(
            getState(STANDARD_WALLET, [
                ethAccount(STANDARD_WALLET_SSID, USDT),
                xrpAccount(STANDARD_WALLET_SSID),
            ]),
        );

        const nativeIndexes = result.flatMap((ticker, index) =>
            ticker.tokenAddress ? [] : [index],
        );
        const tokenIndexes = result.flatMap((ticker, index) =>
            ticker.tokenAddress ? [index] : [],
        );

        expect(result.map(ticker => ticker.symbol)).toContain('xrp');
        expect(tokenIndexes.length).toBeGreaterThan(0);
        expect(Math.max(...nativeIndexes)).toBeLessThan(Math.min(...tokenIndexes));
    });
});

describe('selectHistoricFiatRatesByTimestamp', () => {
    const BTC_USD = 'btc-usd' as CryptoBaseCurrencyPair;
    const HOUR_ALIGNED_TIMESTAMP = 1639706400 as Timestamp;
    const HISTORIC_RATE = 48000;

    const historicRatesState = {
        wallet: {
            fiat: {
                historic: { [BTC_USD]: { [HOUR_ALIGNED_TIMESTAMP]: HISTORIC_RATE } },
            },
        },
    } as unknown as FiatRatesRootState;

    it('returns the historic rate for the timestamp rounded to the nearest past hour', () => {
        const timestampWithinSameHour = (HOUR_ALIGNED_TIMESTAMP + 1800) as Timestamp;

        expect(
            selectHistoricFiatRatesByTimestamp(
                historicRatesState,
                BTC_USD,
                timestampWithinSameHour,
            ),
        ).toBe(HISTORIC_RATE);
    });

    it('returns undefined for an undefined timestamp (e.g. a pending transaction without blockTime)', () => {
        expect(
            selectHistoricFiatRatesByTimestamp(historicRatesState, BTC_USD, undefined),
        ).toBeUndefined();
    });
});

describe('selectCurrentFiatRatesByFiatRateKeys', () => {
    const BTC_USD = 'btc-usd' as CryptoBaseCurrencyPair;
    const ETH_USD = 'eth-usd' as CryptoBaseCurrencyPair;
    const XRP_USD = 'xrp-usd' as CryptoBaseCurrencyPair;
    const ETH_USDC_LOWERCASE_USD = `eth-${USDC}-usd` as CryptoBaseCurrencyPair;
    const ETH_USDC_CHECKSUMMED_USD =
        'eth-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48-usd' as CryptoBaseCurrencyPair;

    const createRate = (rate: number): Rate => ({
        rate,
        lastTickerTimestamp: 1639706400 as Timestamp,
        lastSuccessfulFetchTimestamp: 1639706400 as Timestamp,
        isLoading: false,
        error: null,
        ticker: { symbol: 'btc' as NetworkSymbol },
    });

    const btcRate = createRate(48000);
    const ethRate = createRate(4000);
    const xrpRate = createRate(1);

    const getCurrentRatesState = (current: Partial<Record<CryptoBaseCurrencyPair, Rate>>) =>
        ({ wallet: { fiat: { current, lastWeek: {}, historic: {} } } }) as FiatRatesRootState;

    it('returns only the rates for the provided fiat rate keys', () => {
        const state = getCurrentRatesState({
            [BTC_USD]: btcRate,
            [ETH_USD]: ethRate,
            [XRP_USD]: xrpRate,
        });

        expect(selectCurrentFiatRatesByFiatRateKeys(state, [BTC_USD, ETH_USD])).toEqual({
            [BTC_USD]: btcRate,
            [ETH_USD]: ethRate,
        });
    });

    it('omits keys without a rate', () => {
        const state = getCurrentRatesState({ [BTC_USD]: btcRate });

        expect(selectCurrentFiatRatesByFiatRateKeys(state, [BTC_USD, ETH_USD])).toEqual({
            [BTC_USD]: btcRate,
        });
    });

    it('returns an empty object when fiat rates are not loaded yet', () => {
        const state = { wallet: {} } as FiatRatesRootState;

        expect(selectCurrentFiatRatesByFiatRateKeys(state, [BTC_USD])).toEqual({});
    });

    it('keeps the same reference when unrelated rates change', () => {
        const first = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [BTC_USD]: btcRate, [XRP_USD]: xrpRate }),
            [BTC_USD],
        );
        const second = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [BTC_USD]: btcRate, [XRP_USD]: createRate(2) }),
            [BTC_USD],
        );

        expect(second).toBe(first);
    });

    it('keeps the same reference across recreated state and keys arrays', () => {
        const first = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [BTC_USD]: btcRate, [ETH_USD]: ethRate }),
            [BTC_USD, ETH_USD],
        );
        const second = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [BTC_USD]: btcRate, [ETH_USD]: ethRate }),
            [BTC_USD, ETH_USD],
        );

        expect(second).toBe(first);
    });

    it('returns a new reference when a requested rate changes', () => {
        const first = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [BTC_USD]: btcRate }),
            [BTC_USD],
        );
        const updatedBtcRate = createRate(50000);
        const second = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [BTC_USD]: updatedBtcRate }),
            [BTC_USD],
        );

        expect(second).not.toBe(first);
        expect(second[BTC_USD]).toBe(updatedBtcRate);
    });

    it('returns different references for different key sets sharing a rate', () => {
        const state = getCurrentRatesState({ [BTC_USD]: btcRate, [ETH_USD]: ethRate });

        const btcOnly = selectCurrentFiatRatesByFiatRateKeys(state, [BTC_USD]);
        const btcAndEth = selectCurrentFiatRatesByFiatRateKeys(state, [BTC_USD, ETH_USD]);

        expect(btcOnly).not.toBe(btcAndEth);
        expect(Object.keys(btcOnly)).toEqual([BTC_USD]);
        expect(Object.keys(btcAndEth)).toEqual([BTC_USD, ETH_USD]);
    });

    it('falls back to a rate stored under a differently cased token address key', () => {
        const usdcRate = createRate(1);
        const state = getCurrentRatesState({ [ETH_USDC_CHECKSUMMED_USD]: usdcRate });

        expect(selectCurrentFiatRatesByFiatRateKeys(state, [ETH_USDC_LOWERCASE_USD])).toEqual({
            [ETH_USDC_LOWERCASE_USD]: usdcRate,
        });
    });

    it('prefers the exactly matching key over a differently cased one', () => {
        const exactRate = createRate(1);
        const otherCasingRate = createRate(2);
        const state = getCurrentRatesState({
            [ETH_USDC_LOWERCASE_USD]: exactRate,
            [ETH_USDC_CHECKSUMMED_USD]: otherCasingRate,
        });

        expect(
            selectCurrentFiatRatesByFiatRateKeys(state, [ETH_USDC_LOWERCASE_USD])[
                ETH_USDC_LOWERCASE_USD
            ],
        ).toBe(exactRate);
    });

    it('keeps the same reference when a case-insensitive match is unchanged', () => {
        const usdcRate = createRate(1);
        const first = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({ [ETH_USDC_CHECKSUMMED_USD]: usdcRate, [BTC_USD]: btcRate }),
            [ETH_USDC_LOWERCASE_USD],
        );
        const second = selectCurrentFiatRatesByFiatRateKeys(
            getCurrentRatesState({
                [ETH_USDC_CHECKSUMMED_USD]: usdcRate,
                [BTC_USD]: createRate(50000),
            }),
            [ETH_USDC_LOWERCASE_USD],
        );

        expect(second).toBe(first);
    });
});
