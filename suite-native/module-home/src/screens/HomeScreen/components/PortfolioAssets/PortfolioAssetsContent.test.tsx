import { Text } from 'react-native';

import { combineReducers } from '@reduxjs/toolkit';

import { mockNetworksState } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
    screen,
    within,
} from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/device-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { PortfolioAssetsContent } from './PortfolioAssetsContent';

type MockPortfolioAssetListItemProps = {
    assetKey: WalletAssetKey;
};

jest.mock('./PortfolioAssetsHeader', () => ({
    PortfolioAssetsHeader: () => null,
}));

jest.mock('./PortfolioAssetListItem', () => ({
    PortfolioAssetListItem: ({ assetKey }: MockPortfolioAssetListItemProps) => (
        <Text>{assetKey}</Text>
    ),
}));

const DEVICE_STATE = 'aliceWallet@device:0' as StaticSessionId;
const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');
const ASSET_ROW = /^aliceWallet@device:0\//;
const ETH_NETWORK_HEADER = '@home/portfolio-assets/network/eth';
const BTC_NETWORK_HEADER = '@home/portfolio-assets/network/btc';

const walletSettingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});

const getTokenContract = (index: number) =>
    `0x${index.toString(16).padStart(40, '0')}` as TokenAddress;

type CreateStoreParams = {
    ethAssetCount: number;
    hasBitcoin?: boolean;
    grouping?: HomeAssetsTableGrouping;
    ethUsdRate?: number;
};

// The Ethereum account's coin is one row, so `ethAssetCount - 1` tokens make up the rest.
const createStore = ({
    ethAssetCount,
    hasBitcoin = false,
    grouping,
    ethUsdRate,
}: CreateStoreParams) => {
    const tokenContracts = Array.from({ length: Math.max(ethAssetCount - 1, 0) }, (_, index) =>
        getTokenContract(index + 1),
    );
    const ethAccounts =
        ethAssetCount === 0
            ? []
            : [
                  mockWalletAccount({
                      symbol: ETH,
                      deviceState: DEVICE_STATE,
                      formattedBalance: '1',
                      tokens: tokenContracts.map(contract =>
                          mockAccountToken({ contract, balance: '1' }),
                      ),
                  }),
              ];
    const btcAccounts = hasBitcoin
        ? [mockWalletAccount({ symbol: BTC, deviceState: DEVICE_STATE, formattedBalance: '1' })]
        : [];

    return createLightStore({
        reducer: {
            device: createStaticReducer({
                selectedDevice: { state: { staticSessionId: DEVICE_STATE } },
            }),
            discreetMode: createStaticReducer({ isActive: false }),
            locale: localeReducer,
            networks: createStaticReducer(mockNetworksState([ETH, BTC])),
            tokenDefinitions: createStaticReducer({
                [ETH]: { coin: { data: tokenContracts, hide: [], show: [] } },
            }),
            wallet: combineReducers({
                accounts: createStaticReducer([...ethAccounts, ...btcAccounts]),
                settings: walletSettingsReducer,
                fiat: createStaticReducer({
                    current:
                        ethUsdRate === undefined
                            ? {}
                            : {
                                  [getFiatRateKey(ETH, 'usd')]: {
                                      rate: ethUsdRate,
                                      usdRate: ethUsdRate,
                                  },
                              },
                    lastWeek: {},
                }),
            }),
        },
        preloadedState: {
            wallet: {
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks: [ETH, BTC],
                    homeAssetsTableGrouping: grouping ?? 'default',
                },
            },
        },
    });
};

const renderPortfolioAssetsContent = async (params: CreateStoreParams) =>
    await renderWithStoreProvider(<PortfolioAssetsContent />, {
        services: { store: createStore(params) },
    });

describe('PortfolioAssetsContent', () => {
    it('hides the assets section header when there are no assets', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 0 });

        expect(screen.queryByText(getTranslation('moduleHome.assets.title'))).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/view-options-button')).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/show-more')).toBeNull();
    });

    it.each([7, 8])('renders all %i assets without the show more button', async count => {
        await renderPortfolioAssetsContent({ ethAssetCount: count });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(count);
        expect(screen.getByText(getTranslation('moduleHome.assets.title'))).toBeTruthy();
        expect(screen.queryByTestId('@home/portfolio-assets/show-more')).toBeNull();
    });

    it('folds more than 8 assets and toggles between show more and show less', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9 });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(8);

        fireEvent.press(screen.getByText(getTranslation('moduleHome.assets.showMore')));

        expect(await screen.findByText(getTranslation('moduleHome.assets.showLess'))).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(9);

        fireEvent.press(screen.getByText(getTranslation('moduleHome.assets.showLess')));

        expect(await screen.findByText(getTranslation('moduleHome.assets.showMore'))).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(8);
    });

    it('renders the stored grouping by networks under network headers', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 3,
            hasBitcoin: true,
            grouping: 'networks',
        });

        expect(screen.getByTestId(ETH_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getByTestId(BTC_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getByText('Ethereum')).toBeTruthy();
        expect(screen.getByText('Bitcoin')).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(4);
    });

    it('puts the priced network first and totals only what can be priced', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 1,
            hasBitcoin: true,
            grouping: 'networks',
            ethUsdRate: 3000,
        });

        const ethHeader = screen.getByTestId(ETH_NETWORK_HEADER);
        const btcHeader = screen.getByTestId(BTC_NETWORK_HEADER);

        expect(screen.getAllByTestId(/^@home\/portfolio-assets\/network\//)).toEqual([
            ethHeader,
            btcHeader,
        ]);
        expect(within(ethHeader).getByText(/3,000/)).toBeTruthy();
        expect(within(btcHeader).queryByText(/\d/)).toBeNull();
    });

    it('folds grouped assets to 8 rows across networks and shows the rest on show more', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 9,
            hasBitcoin: true,
            grouping: 'networks',
        });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(8);

        fireEvent.press(screen.getByText(getTranslation('moduleHome.assets.showMore')));

        expect(await screen.findByText(getTranslation('moduleHome.assets.showLess'))).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(10);
        expect(screen.getByTestId(ETH_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getByTestId(BTC_NETWORK_HEADER)).toBeTruthy();
    });

    it('switches the grouping from the view options sheet', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3, hasBitcoin: true });

        expect(screen.queryByTestId(ETH_NETWORK_HEADER)).toBeNull();

        fireEvent.press(
            screen.getByTestId('@home/portfolio-assets/view-options/grouping/networks'),
        );

        expect(await screen.findByTestId(ETH_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getByTestId(BTC_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(4);

        fireEvent.press(screen.getByTestId('@home/portfolio-assets/view-options/grouping/default'));

        expect(await screen.findAllByText(ASSET_ROW)).toHaveLength(4);
        expect(screen.queryByTestId(ETH_NETWORK_HEADER)).toBeNull();
        expect(screen.queryByTestId(BTC_NETWORK_HEADER)).toBeNull();
    });

    it('keeps the list expanded when switching the grouping', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9, hasBitcoin: true });

        fireEvent.press(screen.getByText(getTranslation('moduleHome.assets.showMore')));
        expect(await screen.findByText(getTranslation('moduleHome.assets.showLess'))).toBeTruthy();

        fireEvent.press(
            screen.getByTestId('@home/portfolio-assets/view-options/grouping/networks'),
        );

        expect(await screen.findByTestId(BTC_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(10);
    });
});
