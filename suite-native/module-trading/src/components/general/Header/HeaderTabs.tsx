import { useMemo } from 'react';

import { LinearGradient } from 'expo-linear-gradient';

import { useServices } from '@suite-common/dependency-injection';
import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack, type SubTabItem, SubTabs } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

import { useTradingTabs } from '../../../hooks/general/useTradingTabs';

const useTabsData = () => {
    const { translate } = useTranslate();

    return useMemo(() => {
        const tabs: SubTabItem<TradingTypeWithConcierge>[] = [
            {
                value: 'exchange',
                label: translate('moduleTrading.tradingScreen.tabs.exchange'),
                icon: 'repeat',
                testID: '@trading/exchange/header-tab',
            },
            {
                value: 'buy',
                label: translate('moduleTrading.tradingScreen.tabs.buy'),
                icon: 'plus',
                testID: '@trading/buy/header-tab',
            },
            {
                value: 'sell',
                label: translate('moduleTrading.tradingScreen.tabs.sell'),
                icon: 'minus',
                testID: '@trading/sell/header-tab',
            },
            {
                value: 'concierge',
                label: translate('moduleTrading.tradingScreen.tabs.concierge'),
                icon: 'handshake',
                testID: '@trading/concierge/header-tab',
            },
        ];

        return tabs;
    }, [translate]);
};

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
                <SubTabs items={data} onChange={onTabPress} value={activeTab} />
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
