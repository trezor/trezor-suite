import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Rate } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetFirstDashboard } from './AssetFirstDashboard';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');

const getInitialState = (
    accounts = [mockWalletAccount({ symbol: BTC, formattedBalance: '0.5' })],
): AppState => ({
    ...mockInitialAppState,
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts,
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [BTC],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: { [getFiatRateKey(BTC, 'usd')]: { rate: 100000 } as Rate },
            lastWeek: { [getFiatRateKey(BTC, 'usd')]: { rate: 90000 } as Rate },
        },
    },
});

describe('AssetFirstDashboard', () => {
    const render = (accounts?: AppState['wallet']['accounts']) => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(accounts),
        });

        renderWithProviders(root, <AssetFirstDashboard />);
    };

    it('is the balance and the assets, and nothing else', () => {
        render();

        expect(screen.getByTestId('@dashboard/asset-first/fiat-amount')).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/asset-first-item/btc/coin')).toBeInTheDocument();
        expect(screen.queryByTestId('@wallet/menu/wallet-global-send')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@dashboard/loading')).not.toBeInTheDocument();
    });

    it('tells a wallet with nothing on it what the dashboard would have', () => {
        // The state the dashboard this replaces shows when nothing is activated, rather than a
        // table with no rows in it.
        render([]);

        expect(screen.queryByTestId('@dashboard/asset-first/fiat-amount')).not.toBeInTheDocument();
        expect(screen.getByTestId('@exception/discovery-empty')).toBeInTheDocument();
    });

    it('says what the wallet gained against its rate a week ago', () => {
        render();

        const weekChange = screen.getByTestId('@dashboard/asset-first/week-change');

        expect(weekChange).toHaveTextContent('7d');
        expect(weekChange).toHaveTextContent('+11.11%');
    });
});
