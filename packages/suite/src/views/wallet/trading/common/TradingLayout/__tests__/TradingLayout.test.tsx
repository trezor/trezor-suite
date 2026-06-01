import '@suite-common/test-utils/src/globalOverrides';

import { screen } from '@testing-library/react';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { type AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { configureStore } from 'src/support/tests/configureStore';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { TradingLayout } from '../TradingLayout';

jest.mock('@suite-common/tx-simulation', () => ({}));

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span data-testid={id}>{id}</span>,
}));

jest.mock('../TradingLayoutNavigation', () => ({
    TradingLayoutNavigation: ({ route }: { route?: string }) => (
        <div data-testid="trading-layout-navigation">{route}</div>
    ),
}));

jest.mock('src/components/wallet/WalletLayout/AccountException/DiscoveryEmpty', () => ({
    DiscoveryEmpty: () => <div data-testid="discovery-empty" />,
}));

jest.mock('src/views/wallet/receive/components/ConnectDevicePromo', () => ({
    ConnectDeviceGenericPromo: () => <div data-testid="connect-device-promo" />,
}));

const DEVICE_SSID = 'btc-address@device_id:0' as const;
const CONNECTED_SELECTED_DEVICE = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: DEVICE_SSID },
});
const DISCONNECTED_SELECTED_DEVICE = mockSuiteDevice({
    connected: false,
    available: false,
    state: { staticSessionId: DEVICE_SSID },
});

const visibleBtcAccount = {
    deviceState: DEVICE_SSID,
    key: 'btc-account-key' as AccountKey,
    accountType: 'normal',
    visible: true,
    empty: false,
    symbol: 'btc',
    networkType: 'bitcoin',
} as unknown as Account;

type BuildStateParams = {
    accounts: Account[];
    selectedDevice?: AppState['device']['selectedDevice'];
};

const buildState = ({
    accounts,
    selectedDevice = CONNECTED_SELECTED_DEVICE,
}: BuildStateParams): AppState => ({
    ...initialAppState,
    device: {
        ...initialAppState.device,
        selectedDevice,
    },
    wallet: {
        ...initialAppState.wallet,
        accounts,
    },
    router: {
        ...initialAppState.router,
        app: 'wallet',
        route: {
            name: 'wallet-trading-buy',
            pattern: '/accounts/coinmarket/buy',
            app: 'wallet',
        },
    } as AppState['router'],
});

const mockStore = configureStore<AppState, any>();

describe('TradingLayout', () => {
    it('renders children when the selected device has visible accounts', () => {
        const store = mockStore(buildState({ accounts: [visibleBtcAccount] }));

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingLayout>
                <div data-testid="trading-content" />
            </TradingLayout>,
        );

        expect(screen.getByTestId('trading-layout-navigation')).toHaveTextContent(
            'wallet-trading-buy',
        );
        expect(screen.getByTestId('trading-content')).toBeInTheDocument();
        expect(screen.queryByTestId('discovery-empty')).not.toBeInTheDocument();
    });

    it('renders DiscoveryEmpty exception when the selected device has no visible accounts', () => {
        const store = mockStore(buildState({ accounts: [] }));

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingLayout>
                <div data-testid="trading-content" />
            </TradingLayout>,
        );

        expect(screen.queryByTestId('trading-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('trading-layout-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('discovery-empty')).toBeInTheDocument();
        expect(screen.queryByTestId('connect-device-promo')).not.toBeInTheDocument();
    });

    it('renders DiscoveryEmpty when accounts exist but none match the selected device', () => {
        const otherDeviceAccount = {
            ...visibleBtcAccount,
            deviceState: 'different-device@device_id:1',
        } as Account;
        const store = mockStore(buildState({ accounts: [otherDeviceAccount] }));

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingLayout>
                <div data-testid="trading-content" />
            </TradingLayout>,
        );

        expect(screen.queryByTestId('trading-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('trading-layout-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('discovery-empty')).toBeInTheDocument();
        expect(screen.queryByTestId('connect-device-promo')).not.toBeInTheDocument();
    });

    it('renders connect device promo when the selected device is disconnected', () => {
        const store = mockStore(
            buildState({ accounts: [], selectedDevice: DISCONNECTED_SELECTED_DEVICE }),
        );

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <TradingLayout>
                <div data-testid="trading-content" />
            </TradingLayout>,
        );

        expect(screen.queryByTestId('trading-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('trading-layout-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('connect-device-promo')).toBeInTheDocument();
        expect(screen.queryByTestId('discovery-empty')).not.toBeInTheDocument();
    });
});
