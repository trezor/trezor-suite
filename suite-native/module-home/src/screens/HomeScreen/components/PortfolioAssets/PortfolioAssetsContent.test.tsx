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
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation, localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
    screen,
    waitFor,
    within,
} from '@suite-native/test-utils-store';
import { FirmwareType, type StaticSessionId } from '@trezor/device-utils';
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
const SMALL_BALANCES_SWITCH = '@home/portfolio-assets/view-options/small-balances';
const NEW_BANNER = '@home/portfolio-assets/new-banner';
const FEEDBACK = '@home/portfolio-assets/feedback';

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
    firmwareType?: FirmwareType;
    areSmallBalancesShown?: boolean;
    isNewBannerClosed?: boolean;
    isFeedbackClosed?: boolean;
};

// The Ethereum account's coin is one row, so `ethAssetCount - 1` tokens make up the rest.
const createStore = ({
    ethAssetCount,
    hasBitcoin = false,
    grouping,
    ethUsdRate,
    firmwareType = FirmwareType.Universal,
    areSmallBalancesShown = true,
    isNewBannerClosed = false,
    isFeedbackClosed = false,
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
                selectedDevice: { state: { staticSessionId: DEVICE_STATE }, firmwareType },
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
                    areHomeAssetSmallBalancesShown: areSmallBalancesShown,
                    isHomeAssetTableNewBannerClosed: isNewBannerClosed,
                    isHomeAssetTableFeedbackClosed: isFeedbackClosed,
                },
            },
        },
    });
};

const renderPortfolioAssetsContent = async (params: CreateStoreParams) =>
    await renderWithStoreProvider(<PortfolioAssetsContent />, {
        services: { store: createStore(params), analytics: mockNativeAnalytics(jest.fn()) },
    });

describe('PortfolioAssetsContent', () => {
    it('hides the assets section header when there are no assets', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 0 });

        expect(screen.queryByText(getTranslation('moduleHome.assets.title'))).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/view-options-button')).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/show-more')).toBeNull();
        expect(screen.queryByTestId(NEW_BANNER)).toBeNull();
        expect(screen.queryByTestId(FEEDBACK)).toBeNull();
    });

    it('shows the new banner and the feedback card around a list that does not fold', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3 });

        expect(screen.getByTestId(NEW_BANNER)).toBeTruthy();
        expect(screen.getByText(getTranslation('moduleHome.assets.newBanner.title'))).toBeTruthy();
        expect(screen.getByTestId(FEEDBACK)).toBeTruthy();
        expect(screen.getByText(getTranslation('moduleHome.assets.feedback.title'))).toBeTruthy();
    });

    it('keeps the feedback card under a folded list', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9 });

        expect(screen.getByTestId('@home/portfolio-assets/show-more')).toBeTruthy();
        expect(screen.getByTestId(FEEDBACK)).toBeTruthy();
    });

    it('hides the new banner once dismissed', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3 });

        await fireEvent.press(screen.getByTestId('@home/portfolio-assets/new-banner/dismiss'));

        expect(screen.queryByTestId(NEW_BANNER)).toBeNull();
        expect(screen.getByTestId(FEEDBACK)).toBeTruthy();
    });

    it('hides the feedback card once dismissed', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3 });

        await fireEvent.press(screen.getByTestId('@feedback-form/dismiss-button'));

        expect(screen.queryByTestId(FEEDBACK)).toBeNull();
        expect(screen.getByTestId(NEW_BANNER)).toBeTruthy();
    });

    it('does not bring back what was dismissed before', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 3,
            isNewBannerClosed: true,
            isFeedbackClosed: true,
        });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(3);
        expect(screen.queryByTestId(NEW_BANNER)).toBeNull();
        expect(screen.queryByTestId(FEEDBACK)).toBeNull();
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

    it('hides the small balances switch when no asset is small', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 1, ethUsdRate: 3000 });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(1);
        expect(screen.queryByTestId(SMALL_BALANCES_SWITCH)).toBeNull();
    });

    it('shows how many small balances there are and what they are worth', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3, ethUsdRate: 0.5 });

        const smallBalancesSwitch = screen.getByTestId(SMALL_BALANCES_SWITCH);

        expect(
            within(smallBalancesSwitch).getByText(
                getTranslation('moduleHome.assets.viewOptionsSheet.smallBalancesSummary', {
                    count: 1,
                }),
                { exact: false },
            ),
        ).toBeTruthy();
        expect(within(smallBalancesSwitch).getByText('$0.50')).toBeTruthy();
    });

    it('hides small balances from the list without changing the network total', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 3,
            grouping: 'networks',
            ethUsdRate: 0.5,
        });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(3);

        fireEvent.press(screen.getByTestId(SMALL_BALANCES_SWITCH));

        await waitFor(() => expect(screen.getAllByText(ASSET_ROW)).toHaveLength(2));
        expect(within(screen.getByTestId(ETH_NETWORK_HEADER)).getByText(/0\.5/)).toBeTruthy();
    });

    it('drops a network holding only small balances and brings it back', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 1,
            hasBitcoin: true,
            grouping: 'networks',
            ethUsdRate: 0.5,
        });

        fireEvent.press(screen.getByTestId(SMALL_BALANCES_SWITCH));

        await waitFor(() => expect(screen.queryByTestId(ETH_NETWORK_HEADER)).toBeNull());
        expect(screen.getByTestId(BTC_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(1);

        fireEvent.press(screen.getByTestId(SMALL_BALANCES_SWITCH));

        expect(await screen.findByTestId(ETH_NETWORK_HEADER)).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(2);
    });

    it('expands the list when small balances are turned on', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 9,
            hasBitcoin: true,
            ethUsdRate: 0.5,
            areSmallBalancesShown: false,
        });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(8);
        expect(screen.getByText(getTranslation('moduleHome.assets.showMore'))).toBeTruthy();

        fireEvent.press(screen.getByTestId(SMALL_BALANCES_SWITCH));

        expect(await screen.findByText(getTranslation('moduleHome.assets.showLess'))).toBeTruthy();
        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(10);
    });

    it('offers no view options on Bitcoin-only firmware and lists the assets ungrouped', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 1,
            hasBitcoin: true,
            grouping: 'networks',
            firmwareType: FirmwareType.BitcoinOnly,
        });

        expect(screen.getAllByText(ASSET_ROW)).toHaveLength(1);
        expect(screen.queryByTestId(BTC_NETWORK_HEADER)).toBeNull();
        expect(screen.queryByTestId('@home/portfolio-assets/view-options-button')).toBeNull();
        expect(
            screen.queryByTestId('@home/portfolio-assets/view-options/grouping/networks'),
        ).toBeNull();
    });
});
