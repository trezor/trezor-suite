import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import {
    type Account,
    type Rate,
    type TokenAddress,
    asAccountDescriptor,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import {
    createMockRate,
    ethAsset,
    mockWalletFiatRatesAndSettings,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { type StaticSessionId } from '@trezor/device-utils';

import { selectTradeableAssetBalances } from './tradeableAssetBalancesSelectors';

const USDC_CRYPTO_ID = usdcAsset.cryptoId;
const USDC_CONTRACT = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'tradeableAssets@testDevice:0';
const SELECTED_DEVICE = mockSuiteDevice({
    state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
});

type TestState = AccountsRootState & DeviceRootState & FiatRatesRootState & WalletSettingsRootState;

const createUsdcToken = (contract: TokenAddress, balance: string) =>
    mockAccountToken({
        name: 'USDC',
        symbol: 'USDC',
        contract,
        decimals: 6,
        balance,
    });

const createState = (accounts: Account[], rates: Record<string, Rate> = {}): TestState => ({
    wallet: {
        accounts,
        ...mockWalletFiatRatesAndSettings(rates),
    },
    device: {
        ...deviceInitialState,
        devices: [SELECTED_DEVICE],
        selectedDevice: SELECTED_DEVICE,
    },
});

describe('selectTradeableAssetBalances', () => {
    it('aggregates native and token balances across visible accounts', () => {
        const firstAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('firstEthAccount'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            formattedBalance: '1',
            tokens: [createUsdcToken(USDC_CONTRACT, '1.5')],
        });
        const secondAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('secondEthAccount'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            index: 1,
            formattedBalance: '2',
            tokens: [createUsdcToken(toTokenAddress(USDC_CONTRACT.toUpperCase()), '2.5')],
        });
        const state = createState([firstAccount, secondAccount], {
            [getFiatRateKey('eth', 'usd')]: createMockRate(2_000, 'eth'),
            [getFiatRateKey('eth', 'usd', USDC_CONTRACT)]: createMockRate(1, 'eth'),
        });

        const balances = selectTradeableAssetBalances(state);

        expect(balances.get(ethAsset.cryptoId)).toMatchObject({ cryptoAmount: '3' });
        expect(balances.get(ethAsset.cryptoId)?.fiatAmount?.toString()).toBe('6000');
        expect(balances.get(USDC_CRYPTO_ID)).toMatchObject({ cryptoAmount: '4' });
        expect(balances.get(USDC_CRYPTO_ID)?.fiatAmount?.toString()).toBe('4');
    });

    it('does not include hidden accounts or zero balances', () => {
        const visibleAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('visibleEthAccount'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            formattedBalance: '0',
            tokens: [],
        });
        const hiddenAccount = mockWalletAccount({
            symbol: 'eth',
            descriptor: asAccountDescriptor('hiddenEthAccount'),
            deviceState: DEVICE_STATIC_SESSION_ID,
            formattedBalance: '5',
            visible: false,
            tokens: [],
        });
        const state = createState([visibleAccount, hiddenAccount]);

        expect(selectTradeableAssetBalances(state).size).toBe(0);
    });
});
