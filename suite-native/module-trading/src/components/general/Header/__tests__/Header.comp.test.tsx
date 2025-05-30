import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import {
    PreloadedState,
    fireEvent,
    initStore,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { TradingRootState } from '../../../../tradingSlice';
import { Header } from '../Header';

describe('Header', () => {
    const getFFPreloadedState = ({
        buyEnabled = false,
        sellEnabled = false,
        exchangeEnabled = false,
    }: {
        buyEnabled?: boolean;
        sellEnabled?: boolean;
        exchangeEnabled?: boolean;
    }) => ({
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingBuyEnabled]: buyEnabled,
            [FeatureFlag.IsTradingExchangeEnabled]: exchangeEnabled,
            [FeatureFlag.IsTradingSellEnabled]: sellEnabled,
        },
    });

    const renderHeader = ({
        buyEnabled = false,
        sellEnabled = false,
        exchangeEnabled = false,
        tradingPreloadedState = undefined,
    }: {
        buyEnabled?: boolean;
        sellEnabled?: boolean;
        exchangeEnabled?: boolean;
        tradingPreloadedState?: TradingRootState | undefined;
    }) => {
        const preloadedState: PreloadedState = {
            ...getFFPreloadedState({ buyEnabled, sellEnabled, exchangeEnabled }),

            messageSystem: {
                validMessages: {
                    banner: [],
                    context: [],
                    modal: [],
                    feature: ['actionId'],
                },
                dismissedMessages: [] as any,
                config: {
                    actions: [
                        {
                            message: {
                                id: 'actionId',
                                category: ['feature'],
                                feature: [
                                    {
                                        domain: 'trading.buy',
                                        flag: buyEnabled,
                                    },
                                    {
                                        domain: 'trading.exchange',
                                        flag: sellEnabled,
                                    },
                                    {
                                        domain: 'trading.sell',
                                        flag: exchangeEnabled,
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            ...tradingPreloadedState,
        } as unknown as PreloadedState;

        return renderWithStoreProviderAsync(<Header />, { preloadedState });
    };

    it('should render nothing when no trade type is enabled', async () => {
        const { toJSON } = await renderHeader({});

        expect(toJSON()).toBeNull();
    });

    it('should render Buy header without buttons when only buy is enabled', async () => {
        const { getByText, queryByText } = await renderHeader({ buyEnabled: true });

        expect(getByText('Buy')).toBeOnTheScreen();
        expect(queryByText('Sell')).toBeNull();
        expect(queryByText('Swap')).toBeNull();
    });

    it.each([
        {
            buyEnabled: true,
            sellEnabled: true,
            exchangeEnabled: true,
        },
        {
            buyEnabled: false,
            sellEnabled: true,
            exchangeEnabled: true,
        },
        {
            buyEnabled: true,
            sellEnabled: false,
            exchangeEnabled: true,
        },
        {
            buyEnabled: true,
            sellEnabled: true,
            exchangeEnabled: false,
        },
        {
            buyEnabled: false,
            sellEnabled: true,
            exchangeEnabled: false,
        },
    ])('should display Header tabs with Buy and Swap tabs otherwise, case %#', async config => {
        const { getByText, queryByText } = await renderHeader(config);

        expect(getByText('Buy')).toBeOnTheScreen();
        expect(getByText('Swap')).toBeOnTheScreen();
        expect(queryByText('Sell')).toBeNull();
    });

    it('should display nothing when isAmountInputActive is true', async () => {
        const { toJSON } = await renderHeader({
            buyEnabled: true,
            tradingPreloadedState: {
                wallet: {
                    tradingNew: {
                        isAmountInputActive: true,
                    } as any,
                },
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('should set state on tab button press', async () => {
        const store = await initStore(
            getFFPreloadedState({
                buyEnabled: true,
                exchangeEnabled: true,
            }),
        );
        const { getByText } = await renderWithStoreProviderAsync(<Header />, { store });

        fireEvent.press(getByText('Swap'));

        expect(store.getState().wallet.tradingNew.activeTradingType).toBe('exchange');
    });
});
