import { mockNetworksServices } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { AssetsStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';

import { PortfolioAssetListItem } from './PortfolioAssetListItem';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

const DEVICE_STATE = 'aliceWallet@device:0' as StaticSessionId;
const BTC = asNetworkSymbol('btc');
const POL = asNetworkSymbol('pol');
const USDC_CONTRACT = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' as TokenAddress;
const NAMELESS_CONTRACT = '0x0000000000000000000000000000000000000bad' as TokenAddress;

const bitcoinAccount = mockWalletAccount({
    symbol: BTC,
    deviceState: DEVICE_STATE,
    formattedBalance: '0.10523797',
});

const polygonAccount = mockWalletAccount({
    symbol: POL,
    deviceState: DEVICE_STATE,
    tokens: [
        mockAccountToken({
            contract: USDC_CONTRACT,
            symbol: 'USDC',
            decimals: 6,
            balance: '720',
        }),
        mockAccountToken({
            contract: NAMELESS_CONTRACT,
            symbol: undefined,
            decimals: 18,
            balance: '50',
        }),
    ],
});

const bitcoinKey = getWalletAssetKey({ deviceState: DEVICE_STATE, symbol: BTC });
const usdcOnPolygonKey = getWalletAssetKey({
    deviceState: DEVICE_STATE,
    symbol: POL,
    contractAddress: USDC_CONTRACT,
});
const namelessOnPolygonKey = getWalletAssetKey({
    deviceState: DEVICE_STATE,
    symbol: POL,
    contractAddress: NAMELESS_CONTRACT,
});

const createPreloadedState = (accounts: Account[]) => ({
    device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
    wallet: {
        accounts,
        fiat: {
            current: {
                'btc-usd': { rate: 100000 },
                [`pol-${USDC_CONTRACT}-usd`]: { rate: 1 },
            },
            lastWeek: {},
        },
    },
    tokenDefinitions: {
        [POL]: { coin: { data: [USDC_CONTRACT, NAMELESS_CONTRACT], hide: [], show: [] } },
    },
});

const preloadedState = createPreloadedState([bitcoinAccount, polygonAccount]);
const services = { networks: mockNetworksServices() };

describe('PortfolioAssetListItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders a token with its ticker, network, fiat value and balance', async () => {
        await renderWithStoreProvider(<PortfolioAssetListItem assetKey={usdcOnPolygonKey} />, {
            preloadedState,
            services,
        });

        expect(screen.getByText('USDC')).toBeTruthy();
        expect(screen.getByText('Polygon PoS')).toBeTruthy();
        expect(screen.getByText('$720.00')).toBeTruthy();
        expect(screen.getByText(/^720(\.00)? USDC$/)).toBeTruthy();
    });

    it('does not label the balance of a token without a ticker as the network coin', async () => {
        await renderWithStoreProvider(<PortfolioAssetListItem assetKey={namelessOnPolygonKey} />, {
            preloadedState,
            services,
        });

        expect(screen.getByText(/^50(\.00)?$/)).toBeTruthy();
        expect(screen.queryByText(/POL$/)).toBeNull();
    });

    it('renders a network coin with its ticker, network, fiat value and balance', async () => {
        await renderWithStoreProvider(<PortfolioAssetListItem assetKey={bitcoinKey} />, {
            preloadedState,
            services,
        });

        expect(screen.getByText('BTC')).toBeTruthy();
        expect(screen.getByText('Bitcoin')).toBeTruthy();
        expect(screen.getByText('$10,523.80')).toBeTruthy();
        expect(screen.getByText(/^0\.\d+ BTC$/)).toBeTruthy();
    });

    it('opens the asset detail of the token when pressed', async () => {
        await renderWithStoreProvider(<PortfolioAssetListItem assetKey={usdcOnPolygonKey} />, {
            preloadedState,
            services,
        });

        fireEvent.press(screen.getByTestId(`@home/portfolio-assets/asset/pol/${USDC_CONTRACT}`));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { assetKey: usdcOnPolygonKey },
        });
    });

    it('opens the asset detail of the network coin when pressed', async () => {
        await renderWithStoreProvider(<PortfolioAssetListItem assetKey={bitcoinKey} />, {
            preloadedState,
            services,
        });

        fireEvent.press(screen.getByTestId('@home/portfolio-assets/asset/btc/coin'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { assetKey: bitcoinKey },
        });
    });
});
