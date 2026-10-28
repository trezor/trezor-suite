import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/types/suite';

import { selectRoutedAssetTradeAccountKeys } from './selectRoutedAssetTradeAccountKeys';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');
const deviceState = '1stTestnetAddress@device_id:0';
const usdcContract = `0x${'a'.repeat(40)}`;

const knownUsdc: TokenDefinitionsState = {
    [ethSymbol]: {
        coin: { error: false, isLoading: false, data: [usdcContract], hide: [], show: [] },
    },
};

type RoutedAssetParams = { symbol: NetworkSymbol; contractAddress?: string };

const buildState = (accounts: Account[], params: RoutedAssetParams | undefined): AppState =>
    ({
        wallet: { accounts },
        device: {
            devices: [],
            buttonRequestsByPath: {},
            selectedDevice: mockSuiteDevice({ state: { staticSessionId: deviceState } }),
        },
        networks: mockNetworksState([btcSymbol, ethSymbol]),
        debug: { showDebugMenu: false },
        tokenDefinitions: knownUsdc,
        router: { params },
    }) as unknown as AppState;

const account = (symbol: NetworkSymbol, index: number, overrides: Partial<Account> = {}) =>
    mockWalletAccount({
        symbol,
        index,
        descriptor: asAccountDescriptor(`${symbol}${index}`),
        balance: '0',
        formattedBalance: '0',
        ...overrides,
    });

describe('selectRoutedAssetTradeAccountKeys', () => {
    it('buys into the first receivable account and sells from the first account holding the token', () => {
        const withoutUsdc = account(ethSymbol, 0);
        const withUsdc = account(ethSymbol, 1, {
            tokens: [mockAccountToken({ contract: usdcContract, balance: '5' })],
        });
        const state = buildState([withoutUsdc, withUsdc], {
            symbol: ethSymbol,
            contractAddress: usdcContract,
        });

        expect(selectRoutedAssetTradeAccountKeys(state)).toEqual({
            buy: withoutUsdc.key,
            sell: withUsdc.key,
        });
    });

    it('sells from the first account with a coin balance and never from a coinjoin account', () => {
        const coinjoin = account(btcSymbol, 0, {
            accountType: 'coinjoin',
            balance: '1',
            formattedBalance: '1',
        });
        const empty = account(btcSymbol, 1);
        const funded = account(btcSymbol, 2, { balance: '2', formattedBalance: '2' });
        const state = buildState([coinjoin, empty, funded], { symbol: btcSymbol });

        expect(selectRoutedAssetTradeAccountKeys(state)).toEqual({
            buy: empty.key,
            sell: funded.key,
        });
    });

    it('offers no sell account when nothing holds the asset', () => {
        const empty = account(ethSymbol, 0);
        const state = buildState([empty], { symbol: ethSymbol });

        expect(selectRoutedAssetTradeAccountKeys(state)).toEqual({
            buy: empty.key,
            sell: undefined,
        });
    });

    it('offers nothing when the route has no asset', () => {
        const state = buildState([account(ethSymbol, 0, { balance: '1' })], undefined);

        expect(selectRoutedAssetTradeAccountKeys(state)).toEqual({
            buy: undefined,
            sell: undefined,
        });
    });
});
