import { mockNetworksServices } from '@suite-common/networks/mocks';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { AssetsStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { WalletAssetListItem } from './WalletAssetListItem';

const mockNavigate = jest.fn();

jest.mock('@suite-native/earn', () => ({ AssetYieldRateBadge: () => null }));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

const DEVICE_STATE = 'aliceWallet@device:0';
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

describe('WalletAssetListItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders a token with its ticker, network, fiat value and balance', async () => {
        await renderWithStoreProvider(<WalletAssetListItem assetKey={usdcOnPolygonKey} />, {
            preloadedState,
            services,
        });

        // The ticker appears in both the title and the formatted token amount.
        expect(screen.getAllByText('USDC')).toHaveLength(2);
        expect(screen.getByText('Polygon PoS')).toBeTruthy();
        expect(screen.getByText('$720.00')).toBeTruthy();
        expect(screen.getByText(/^720(\.00)? USDC$/)).toBeTruthy();
    });

    it('does not label the balance of a token without a ticker as the network coin', async () => {
        await renderWithStoreProvider(<WalletAssetListItem assetKey={namelessOnPolygonKey} />, {
            preloadedState,
            services,
        });

        // A token without a ticker still shows a unit: the unknown-token label.
        expect(screen.getByText(/^50(\.00)? Unknown token$/)).toBeTruthy();
        expect(screen.queryByText(/POL$/)).toBeNull();
    });

    it('shows only the balance of an unrecognized token', async () => {
        await renderWithStoreProvider(<WalletAssetListItem assetKey={usdcOnPolygonKey} />, {
            preloadedState: {
                ...preloadedState,
                tokenDefinitions: { [POL]: { coin: { data: [], hide: [], show: [] } } },
            },
            services,
        });

        expect(screen.getByText(/^720(\.00)? USDC$/)).toBeTruthy();
        expect(screen.queryByText('$720.00')).toBeNull();
    });

    it('renders a network coin with its ticker, network, fiat value and balance', async () => {
        await renderWithStoreProvider(<WalletAssetListItem assetKey={bitcoinKey} />, {
            preloadedState,
            services,
        });

        expect(screen.getByText('BTC')).toBeTruthy();
        expect(screen.getByText('Bitcoin')).toBeTruthy();
        expect(screen.getByText('$10,523.80')).toBeTruthy();
        expect(screen.getByText(/^0\.\d+ BTC$/)).toBeTruthy();
    });

    it('opens the asset detail of the token when pressed', async () => {
        await renderWithStoreProvider(<WalletAssetListItem assetKey={usdcOnPolygonKey} />, {
            preloadedState,
            services,
        });

        fireEvent.press(screen.getByTestId(`@assets/wallet-asset/pol/${USDC_CONTRACT}`));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { networkSymbol: 'pol', tokenContract: USDC_CONTRACT },
        });
    });

    it('opens the asset detail of the network coin when pressed', async () => {
        await renderWithStoreProvider(<WalletAssetListItem assetKey={bitcoinKey} />, {
            preloadedState,
            services,
        });

        fireEvent.press(screen.getByTestId('@assets/wallet-asset/btc/coin'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { networkSymbol: 'btc', tokenContract: undefined },
        });
    });
});
