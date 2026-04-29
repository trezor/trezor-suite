import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { events } from '@suite-native/analytics';
import { HStack, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';
import { type IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import {
    type TradingWithFeatureFlagsRootState,
    selectActiveTradingType,
    tradingActions,
} from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { HeaderTab } from './HeaderTab';
import { AdvancedSettingsSheet } from '../../settings/AdvancedSettingsSheet';

const useSelectedTab = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectActiveTradingType);

    const setActiveTab = useCallback(
        (tab: TradingTypeWithConcierge) => {
            dispatch(tradingActions.setActiveTradingType(tab));
        },
        [dispatch],
    );

    return { activeTab, setActiveTab };
};

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
    const { applyStyle } = useNativeStyles();
    const { activeTab, setActiveTab } = useSelectedTab();
    const data = useTabsData();
    const { translate } = useTranslate();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const areTradingExchangeDexesEnabled = useSelector((state: TradingWithFeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlag.AreTradingExchangeDexesEnabled),
    );
    const analytics = useAnalytics();
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
                />
                {areTradingExchangeDexesEnabled && (
                    <IconButton
                        iconName="gear"
                        size="medium"
                        intent="neutral"
                        priority="secondary"
                        accessibilityLabel={translate('moduleTrading.tradingScreen.tabs.settings')}
                        onPress={openModal}
                    />
                )}
            </HStack>
            <AdvancedSettingsSheet ref={bottomSheetRef} closeModal={closeModal} />
        </>
    );
};
