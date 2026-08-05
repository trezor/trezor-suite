import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Box, EdgeFades, HStack, type SubTabItem, SubTabs } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

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

export const HeaderTabs = () => {
    const { utils } = useNativeStyles();
    const { activeTab, setActiveTab } = useTradingTabs();
    const data = useTabsData();
    const { analytics } = useServices(selectNativeAnalyticsDep);

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
        <Box paddingHorizontal="sp16">
            <HStack spacing={0}>
                <SubTabs items={data} onChange={onTabPress} value={activeTab} />
                <EdgeFades direction="horizontal" startSize={utils.spacings.sp20} />
            </HStack>
        </Box>
    );
};
