import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Rate, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetFirstDashboard } from './AssetFirstDashboard';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const mockRate = (rate: number) => ({ rate }) as Rate;

const ethereumAccount = mockWalletAccount({
    symbol: ETH,
    formattedBalance: '2',
    tokens: [
        mockAccountToken({
            name: 'USD Coin',
            symbol: 'USDC',
            contract: USDC_ON_ETH,
            balance: '2400',
        }),
    ],
});

const bitcoinAccount = mockWalletAccount({ symbol: BTC, formattedBalance: '0.1' });

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    tokenDefinitions: {
        [ETH]: {
            coin: { data: [USDC_ON_ETH], error: false, isLoading: false, hide: [], show: [] },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts: [ethereumAccount, bitcoinAccount],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [BTC, ETH],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: {
                [getFiatRateKey(ETH, 'usd')]: mockRate(3000),
                [getFiatRateKey(BTC, 'usd')]: mockRate(100000),
                [getFiatRateKey(ETH, 'usd', USDC_ON_ETH)]: mockRate(1),
            },
        },
    },
});

describe('the asset-first table', () => {
    it('shows one row per asset and network, with the network it is held on', () => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(),
        });

        renderWithProviders(root, <AssetFirstDashboard />);

        expect(screen.getByText('USD Coin')).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/asset-first-item/eth/coin')).toBeInTheDocument();
        expect(
            screen.getByTestId(`@dashboard/asset-first-item/eth/${USDC_ON_ETH}`),
        ).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/asset-first-item/btc/coin')).toBeInTheDocument();
    });

    it('puts the most valuable asset first', () => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(),
        });

        renderWithProviders(root, <AssetFirstDashboard />);

        const assetNames = screen
            .getAllByTestId('@dashboard/asset-first/name')
            .map(element => element.textContent);

        expect(assetNames).toEqual(['Bitcoin', 'Ethereum', 'USD Coin']);
    });
});
