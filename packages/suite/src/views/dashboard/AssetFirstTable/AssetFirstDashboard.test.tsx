import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

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
        accounts: [mockWalletAccount({ symbol: 'btc', formattedBalance: '0.5' })],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: ['btc'],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: { [getFiatRateKey('btc', 'usd')]: { rate: 100000 } as Rate },
        },
    },
});

describe('AssetFirstDashboard', () => {
    it('is the balance and the assets, and nothing else', () => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(),
        });

        renderWithProviders(root, <AssetFirstDashboard />);

        expect(screen.getByTestId('@dashboard/portfolio/fiat-amount')).toBeInTheDocument();
        expect(screen.getByTestId('@dashboard/asset-first-item/btc/coin')).toBeInTheDocument();
        // The graph and its controls belong to the card this view replaces.
        expect(screen.queryByTestId('@dashboard/loading')).not.toBeInTheDocument();
    });
});
