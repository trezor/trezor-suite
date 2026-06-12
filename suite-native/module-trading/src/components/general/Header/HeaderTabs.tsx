import { useEffect, useMemo, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';

import { useServices } from '@suite-common/dependency-injection';
import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

import { HeaderTab } from './HeaderTab';
import { useTradingTabs } from '../../../hooks/general/useTradingTabs';

const useTabsData = () => {
    const { translate } = useTranslate();

    return useMemo(() => {
        const tabs = [
            {
                key: 'exchange',
                label: translate('moduleTrading.tradingScreen.tabs.exchange'),
                icon: 'repeat',
                testID: '@trading/exchange/header-tab',
            },
            {
                key: 'buy',
                label: translate('moduleTrading.tradingScreen.tabs.buy'),
                icon: 'plus',
                testID: '@trading/buy/header-tab',
            },
            {
                key: 'sell',
                label: translate('moduleTrading.tradingScreen.tabs.sell'),
                icon: 'minus',
                testID: '@trading/sell/header-tab',
            },
            {
                key: 'concierge',
                label: translate('moduleTrading.tradingScreen.tabs.concierge'),
                icon: 'handshake',
                testID: '@trading/concierge/header-tab',
            },
        ] as { key: TradingTypeWithConcierge; label: string; icon: IconName; testID: string }[];

        return tabs.filter(Boolean);
    }, [translate]);
};

const tabsStyle = prepareNativeStyle(({ spacings }) => ({
    gap: spacings.sp12,
    paddingHorizontal: spacings.sp16,
}));

const tabsEdgeGradientStyle = prepareNativeStyle<{ position: 'left' | 'right' }>(
    ({ spacings }, { position }) => ({
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: spacings.sp20,
        pointerEvents: 'none',
        extend: [
            {
                condition: position === 'left',
                style: {
                    left: 0,
                },
            },
            {
                condition: position === 'right',
                style: {
                    right: 0,
                },
            },
        ],
    }),
);

export const HeaderTabs = () => {
    const listRef = useRef<FlatList>(null);
    const { applyStyle, utils } = useNativeStyles();
    const { activeTab, setActiveTab } = useTradingTabs();
    const data = useTabsData();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const tabsEdgeGradientColors = useMemo<[string, string, string, string]>(() => {
        const backgroundColor = utils.colors.surfaceFillPage;

        return [
            hexToRgba(backgroundColor, 0.01),
            hexToRgba(backgroundColor, 0.45),
            hexToRgba(backgroundColor, 0.85),
            backgroundColor,
        ];
    }, [utils.colors.surfaceFillPage]);

    const activeTabIndex = useMemo(
        () => data.findIndex(tab => tab.key === activeTab),
        [data, activeTab],
    );

    useEffect(() => {
        if (activeTabIndex < 0) {
            return;
        }

        listRef.current?.scrollToIndex({
            index: activeTabIndex,
            animated: true,
            viewPosition: 0.5,
        });
    }, [activeTabIndex]);

    const onTabPress = (tab: TradingTypeWithConcierge) => {
        if (tab === activeTab) {
            return;
        }

        setActiveTab(tab);
        analytics.report({
            type: events.tradingNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: tab,
                from: `trade/${activeTab ?? 'buy'}`,
            },
        });
    };

    return (
        <>
            <HStack spacing={0}>
                <FlatList
                    ref={listRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    accessible={true}
                    contentContainerStyle={applyStyle(tabsStyle)}
                    renderItem={({ item }) => (
                        <HeaderTab
                            icon={item.icon}
                            active={item.key === activeTab}
                            onPress={() => onTabPress(item.key)}
                            testID={item.testID}
                        >
                            {item.label}
                        </HeaderTab>
                    )}
                    data={data}
                    extraData={activeTab}
                    onScrollToIndexFailed={({ index, averageItemLength }) => {
                        listRef.current?.scrollToOffset({
                            offset: averageItemLength * index,
                        });
                    }}
                />
                <LinearGradient
                    start={{ x: 1, y: 0.5 }}
                    end={{ x: 0, y: 0.5 }}
                    colors={tabsEdgeGradientColors}
                    locations={[0, 0.45, 0.8, 1]}
                    style={applyStyle(tabsEdgeGradientStyle, { position: 'left' })}
                />
                <LinearGradient
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    colors={tabsEdgeGradientColors}
                    locations={[0, 0.45, 0.8, 1]}
                    style={applyStyle(tabsEdgeGradientStyle, { position: 'right' })}
                />
            </HStack>
        </>
    );
};
