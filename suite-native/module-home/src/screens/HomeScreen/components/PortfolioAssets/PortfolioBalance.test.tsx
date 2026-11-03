import { mockNetworksState } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';

import { PortfolioBalance } from './PortfolioBalance';

const DEVICE_STATE = 'aliceWallet@device:0' as StaticSessionId;
const DEVICE_PATH = 'devicePath';
const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');

type CreatePreloadedStateParams = {
    rates: Record<string, { rate: number }>;
    isDiscoveryRunning?: boolean;
};

const createPreloadedState = ({
    rates,
    isDiscoveryRunning = false,
}: CreatePreloadedStateParams) => ({
    device: {
        selectedDevice: { path: DEVICE_PATH, state: { staticSessionId: DEVICE_STATE } },
    },
    wallet: {
        accounts: [
            mockWalletAccount({ symbol: BTC, deviceState: DEVICE_STATE, formattedBalance: '0.5' }),
            mockWalletAccount({ symbol: ETH, deviceState: DEVICE_STATE, formattedBalance: '7' }),
        ],
        settings: { enabledNetworks: [BTC, ETH] },
        fiat: { current: rates, lastWeek: {} },
        discovery: {
            [DEVICE_PATH]: { status: isDiscoveryRunning ? 'running' : 'complete' },
        },
    },
    tokenDefinitions: {},
    networks: mockNetworksState([BTC, ETH]),
});

const RATES = { 'btc-usd': { rate: 100000 }, 'eth-usd': { rate: 3000 } };

describe('PortfolioBalance', () => {
    it('shows no total while discovery is running', async () => {
        await renderWithStoreProvider(<PortfolioBalance />, {
            preloadedState: createPreloadedState({ rates: RATES, isDiscoveryRunning: true }),
        });

        expect(screen.queryByTestId('@home/portfolio-assets/total-balance')).toBeNull();
    });

    it('shows a zero total when nothing can be priced', async () => {
        await renderWithStoreProvider(<PortfolioBalance />, {
            preloadedState: createPreloadedState({ rates: {} }),
        });

        expect(screen.getByTestId('@home/portfolio-assets/total-balance')).toBeTruthy();
        expect(screen.getByText('0')).toBeTruthy();
    });

    it('shows the total of the shown assets', async () => {
        await renderWithStoreProvider(<PortfolioBalance />, {
            preloadedState: createPreloadedState({ rates: RATES }),
        });

        expect(screen.getByTestId('@home/portfolio-assets/total-balance')).toBeTruthy();
        expect(screen.getByText('71,000')).toBeTruthy();
    });

    it('conceals and redacts the total when privacy mode is enabled', async () => {
        await renderWithStoreProvider(<PortfolioBalance />, {
            preloadedState: {
                ...createPreloadedState({ rates: RATES }),
                discreetMode: { isActive: true },
            },
        });

        expect(screen.queryByText('71,000', { includeHiddenElements: true })).toBeNull();
        expect(screen.getByText('###', { includeHiddenElements: true })).not.toBeVisible();
        expect(screen.getByText('$', { includeHiddenElements: true })).not.toBeVisible();
    });
});
