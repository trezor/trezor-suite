import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Rate } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetFirstDashboard } from './AssetFirstDashboard';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        // `GlobalSendReceive`, which the header renders, reads it.
        selectedAccount: selectedAccountInitialState,
        accounts: [mockWalletAccount({ symbol: 'btc', formattedBalance: '0.5' })],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: ['btc'],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: { [getFiatRateKey('btc', 'usd')]: { rate: 100000 } as Rate },
            lastWeek: { [getFiatRateKey('btc', 'usd')]: { rate: 90000 } as Rate },
        },
    },
});

describe('AssetFirstDashboard', () => {
    const render = () => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(),
        });

        renderWithProviders(root, <AssetFirstDashboard />);
    };

    it('is the balance, the actions and the assets, and nothing else', () => {
        render();

        expect(screen.getByTestId('@dashboard/asset-first/fiat-amount')).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/asset-first/swap')).toBeInTheDocument();
        // Receive and send are the app's own buttons, with the account picker behind them.
        expect(screen.getAllByTestId('@wallet/menu/wallet-global-receive')).not.toHaveLength(0);
        expect(screen.getAllByTestId('@wallet/menu/wallet-global-send')).not.toHaveLength(0);
        expect(screen.getByTestId('@dashboard/asset-first-item/btc/coin')).toBeInTheDocument();
        // The graph and its controls belong to the card this view replaces.
        expect(screen.queryByTestId('@dashboard/loading')).not.toBeInTheDocument();
    });

    it('says what the wallet gained against its rate a week ago', () => {
        // 0.5 BTC at 100 000 is 50 000 today and 45 000 a week ago.
        render();

        expect(screen.getByTestId('@dashboard/asset-first/week-change')).toHaveTextContent(
            'over 7d',
        );
    });
});
