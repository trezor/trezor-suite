import { Text } from 'react-native';

import { combineReducers } from '@reduxjs/toolkit';

import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import { stakingInitialState } from '@suite-common/earn-staking';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '@suite-common/wallet-core';
import { type HomeAssetsTableGrouping } from '@suite-common/wallet-types';
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

type MockWalletAssetListItemProps = {
    assetKey: WalletAssetKey;
};

jest.mock('./PortfolioAssetsHeader', () => ({
    PortfolioAssetsHeader: () => null,
}));

jest.mock('./PortfolioAssetsEmptyState', () => ({
    PortfolioAssetsEmptyState: () => <Text testID="@home/portfolio-assets/empty-state" />,
}));

jest.mock('@suite-native/assets', () => ({
    ...jest.requireActual('@suite-native/assets'),
    WalletAssetListItem: ({ assetKey }: MockWalletAssetListItemProps) => <Text>{assetKey}</Text>,
}));

const DEVICE_STATE = 'aliceWallet@device:0' as StaticSessionId;
const ETH = asNetworkSymbol('eth');
const BTC = asNetworkSymbol('btc');
const ASSET_ROW = /^aliceWallet@device:0\//;
const ETH_NETWORK_HEADER = '@home/portfolio-assets/network/eth';
const BTC_NETWORK_HEADER = '@home/portfolio-assets/network/btc';
const SMALL_BALANCES_SWITCH = '@home/portfolio-assets/view-options/small-balances';
const HIDDEN_TOKENS_OPTION = '@home/portfolio-assets/view-options/hidden-tokens';
const NEW_BANNER = '@home/portfolio-assets/new-banner';
const EMPTY_STATE = '@home/portfolio-assets/empty-state';
const SMALL_BALANCES_EMPTY_STATE = '@home/portfolio-assets/small-balances-empty-state';
const FEEDBACK = '@home/portfolio-assets/feedback';
const LOADING_SKELETON = '@home/portfolio-assets/loading-skeleton';
const SHOW_MORE = '@home/portfolio-assets/show-more';
const SHOW_MORE_LOADING = '@home/portfolio-assets/show-more/loading';
const DEVICE_PATH = 'devicePath';
const REFERRAL_BUTTON = getTranslation('moduleHome.buttons.referral');

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
    isDiscoveryRunning?: boolean;
    unrecognizedTokenCount?: number;
    deviceId?: string;
};

// The Ethereum account's coin is one row, so `ethAssetCount - 1` tokens make up the rest. With no rows
// but unrecognized tokens, the account holds nothing else.
const createStore = ({
    ethAssetCount,
    hasBitcoin = false,
    grouping,
    ethUsdRate,
    firmwareType = FirmwareType.Universal,
    areSmallBalancesShown = true,
    isNewBannerClosed = false,
    isFeedbackClosed = false,
    isDiscoveryRunning = false,
    unrecognizedTokenCount = 0,
    deviceId,
}: CreateStoreParams) => {
    const tokenContracts = Array.from({ length: Math.max(ethAssetCount - 1, 0) }, (_, index) =>
        getTokenContract(index + 1),
    );
    const unrecognizedTokenContracts = Array.from({ length: unrecognizedTokenCount }, (_, index) =>
        getTokenContract(ethAssetCount + index + 1),
    );
    const ethAccounts =
        ethAssetCount === 0 && unrecognizedTokenCount === 0
            ? []
            : [
                  mockWalletAccount({
                      symbol: ETH,
                      deviceState: DEVICE_STATE,
                      formattedBalance: ethAssetCount === 0 ? '0' : '1',
                      tokens: [...tokenContracts, ...unrecognizedTokenContracts].map(contract =>
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
                selectedDevice: {
                    id: deviceId,
                    path: DEVICE_PATH,
                    state: { staticSessionId: DEVICE_STATE },
                    firmwareType,
                },
            }),
            discreetMode: createStaticReducer({ isActive: false }),
            earn: createStaticReducer({ staking: stakingInitialState }),
            locale: localeReducer,
            networks: createStaticReducer(mockNetworksState([ETH, BTC])),
            tokenDefinitions: createStaticReducer({
                [ETH]: { coin: { data: tokenContracts, hide: [], show: [] } },
            }),
            wallet: combineReducers({
                accounts: createStaticReducer([...ethAccounts, ...btcAccounts]),
                settings: walletSettingsReducer,
                discovery: createStaticReducer(
                    isDiscoveryRunning
                        ? { [DEVICE_PATH]: { status: 'progress', total: 1, progress: 0 } }
                        : {},
                ),
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
    it('shows the empty state under the assets section header when there are no assets', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 0 });

        expect(screen.getByTestId(EMPTY_STATE)).toBeTruthy();
        expect(screen.getByText(getTranslation('moduleHome.assets.title'))).toBeTruthy();
        expect(screen.queryByTestId(NEW_BANNER)).toBeNull();
        expect(screen.getByText(REFERRAL_BUTTON)).toBeTruthy();
        expect(screen.queryByTestId('@home/portfolio-assets/show-more')).toBeNull();
        expect(screen.queryByTestId(FEEDBACK)).toBeNull();
    });

    it('hides the empty state and the new banner while discovery runs', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 0, isDiscoveryRunning: true });

        expect(screen.queryByTestId(EMPTY_STATE)).toBeNull();
        expect(screen.queryByTestId(NEW_BANNER)).toBeNull();
        expect(screen.getByTestId(LOADING_SKELETON)).toBeTruthy();
    });

    it('shows the default empty state when small balances are hidden but there are none', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 0, areSmallBalancesShown: false });

        expect(screen.getByTestId(EMPTY_STATE)).toBeTruthy();
        expect(screen.queryByTestId(SMALL_BALANCES_EMPTY_STATE)).toBeNull();
    });

    it('offers to show small balances when they are all the wallet holds', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 1,
            ethUsdRate: 0.01,
            areSmallBalancesShown: false,
        });

        expect(screen.queryAllByText(ASSET_ROW)).toHaveLength(0);
        expect(screen.getByTestId(SMALL_BALANCES_EMPTY_STATE)).toBeTruthy();
        expect(screen.queryByTestId(EMPTY_STATE)).toBeNull();
        expect(screen.queryByTestId(FEEDBACK)).toBeNull();

        fireEvent.press(screen.getByTestId(`${SMALL_BALANCES_EMPTY_STATE}/show-button`));

        await waitFor(() => expect(screen.getAllByText(ASSET_ROW)).toHaveLength(1));
        expect(screen.queryByTestId(SMALL_BALANCES_EMPTY_STATE)).toBeNull();
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

    it('shows the referral button under the list', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9 });

        expect(screen.getByText(REFERRAL_BUTTON)).toBeTruthy();
    });

    it('hides the referral button for the portfolio tracker', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 3,
            deviceId: PORTFOLIO_TRACKER_DEVICE_ID,
        });

        expect(screen.queryByText(REFERRAL_BUTTON)).toBeNull();
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

    it('shows the loading skeleton under a list that does not fold while discovery runs', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3, isDiscoveryRunning: true });

        expect(screen.getByTestId(LOADING_SKELETON)).toBeTruthy();
    });

    it('shows the loading skeleton under a folded list only once it is expanded', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9, isDiscoveryRunning: true });

        expect(screen.queryByTestId(LOADING_SKELETON)).toBeNull();

        await fireEvent.press(screen.getByTestId(SHOW_MORE));

        expect(screen.getByTestId(LOADING_SKELETON)).toBeTruthy();
    });

    it('hides the loading skeleton once discovery is finished', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3 });

        expect(screen.queryByTestId(LOADING_SKELETON)).toBeNull();
    });

    it('shows the loading balances caption on show more and show less while discovery runs', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9, isDiscoveryRunning: true });

        expect(screen.getByTestId(SHOW_MORE_LOADING)).toBeTruthy();

        await fireEvent.press(screen.getByTestId(SHOW_MORE));

        expect(screen.getByText(getTranslation('moduleHome.assets.showLess'))).toBeTruthy();
        expect(screen.getByTestId(SHOW_MORE_LOADING)).toBeTruthy();
    });

    it('shows how many tokens are hidden', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 3, unrecognizedTokenCount: 2 });

        expect(within(screen.getByTestId(HIDDEN_TOKENS_OPTION)).getByText('2')).toBeTruthy();
    });

    it('keeps view options reachable in a wallet that holds only hidden tokens', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 0, unrecognizedTokenCount: 2 });

        expect(screen.queryAllByText(ASSET_ROW)).toHaveLength(0);
        expect(screen.getByTestId(EMPTY_STATE)).toBeTruthy();
        expect(screen.getByTestId('@home/portfolio-assets/view-options-button')).toBeTruthy();
        expect(within(screen.getByTestId(HIDDEN_TOKENS_OPTION)).getByText('2')).toBeTruthy();
    });

    it('shows a spinner instead of the hidden token count while discovery runs', async () => {
        await renderPortfolioAssetsContent({
            ethAssetCount: 3,
            unrecognizedTokenCount: 2,
            isDiscoveryRunning: true,
        });

        const hiddenTokensOption = screen.getByTestId(HIDDEN_TOKENS_OPTION);

        expect(within(hiddenTokensOption).getByTestId('@circular-spinner')).toBeTruthy();
        expect(within(hiddenTokensOption).queryByText('2')).toBeNull();
    });

    it('hides the loading balances caption once discovery is finished', async () => {
        await renderPortfolioAssetsContent({ ethAssetCount: 9 });

        expect(screen.queryByTestId(SHOW_MORE_LOADING)).toBeNull();
    });
});
