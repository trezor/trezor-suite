import { type DeviceRootState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectTickerFromAccounts } from '../fiatRatesSelectors';
import { type FiatRatesRootState } from '../fiatRatesTypes';

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
