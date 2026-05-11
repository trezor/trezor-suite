import { useEffect, useMemo, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';

import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { HStack, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { HeaderTab } from './HeaderTab';
import { useTradingTabs } from '../../../hooks/general/useTradingTabs';
import { AdvancedSettingsSheet } from '../../settings/AdvancedSettingsSheet';

const useTabsData = () => {
    const { translate } = useTranslate();

    return useMemo(() => {
        const tabs = [
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
                key: 'exchange',
                label: translate('moduleTrading.tradingScreen.tabs.exchange'),
                icon: 'arrowsLeftRight',
                testID: '@trading/exchange/header-tab',
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
}));

export const HeaderTabs = () => {
    const listRef = useRef<FlatList>(null);
    const { applyStyle } = useNativeStyles();
    const { activeTab, setActiveTab } = useTradingTabs();
    const data = useTabsData();
    const { translate } = useTranslate();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const analytics = useAnalytics();

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
            <HStack justifyContent="space-between">
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
                <IconButton
                    iconName="gear"
                    size="medium"
                    intent="neutral"
                    priority="secondary"
                    accessibilityLabel={translate('moduleTrading.tradingScreen.tabs.settings')}
                    onPress={openModal}
                />
            </HStack>
            <AdvancedSettingsSheet ref={bottomSheetRef} closeModal={closeModal} />
        </>
    );
};
