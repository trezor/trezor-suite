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

    it('is the balance and the assets, and nothing else', () => {
        render();

        expect(screen.getByTestId('@dashboard/asset-first/fiat-amount')).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/asset-first-item/btc/coin')).toBeInTheDocument();
        // The actions belong to the app's page header, and the promotions to the card this view
        // replaces.
        expect(screen.queryByTestId('@wallet/menu/wallet-global-send')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@dashboard/loading')).not.toBeInTheDocument();
    });

    it('says what the wallet gained against its rate a week ago', () => {
        // 0.5 BTC at 100 000 is 50 000 today and 45 000 a week ago: 5 000 more, a ninth of it.
        render();

        const weekChange = screen.getByTestId('@dashboard/asset-first/week-change');

        expect(weekChange).toHaveTextContent('7d');
        expect(weekChange).toHaveTextContent('11.1%');
    });
});
