import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { initialState as selectedAccountInitialState } from '@suite/account';
import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type StaticSessionId } from '@trezor/device-utils';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { HomeAssetDashboard } from './HomeAssetDashboard';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');

type HomeAssetDashboardTestDeps = WithServices<DesktopAnalyticsDep>;

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: selectedAccountInitialState,
        accounts: [],
        settings: { ...mockInitialAppState.wallet.settings, enabledNetworks: [BTC] },
    },
});

describe('HomeAssetDashboard', () => {
    it('shows a wallet holding nothing an empty state instead of the table', () => {
        const { services } = createTestCompositionRoot<HomeAssetDashboardTestDeps, AppState>({
            preloadedState: getInitialState(),
            services: () => ({ analytics: mockDesktopAnalytics() }),
        });

        renderWithProviders(services, <HomeAssetDashboard />);

        expect(screen.getByTestId('@dashboard/home-asset/empty-state')).toBeInTheDocument();
        expect(screen.queryByTestId('@dashboard/home-asset')).not.toBeInTheDocument();
    });
});
