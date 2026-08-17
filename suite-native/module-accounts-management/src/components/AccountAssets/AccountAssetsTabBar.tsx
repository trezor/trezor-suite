import { type ComponentProps, useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { type NetworkType } from '@suite-common/wallet-config';
import { Button } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type AccountAssetsFlow, type AccountAssetsTab } from './types';
import { useActiveTabScroll } from './useActiveTabScroll';

const scrollStyle = prepareNativeStyle(() => ({
    flexGrow: 0,
}));

const scrollContentStyle = prepareNativeStyle(({ spacings }) => ({
    alignItems: 'flex-start',
    gap: spacings.sp12,
    paddingVertical: spacings.sp8,
}));

interface TabItem {
    tab: AccountAssetsTab;
    icon: NonNullable<ComponentProps<typeof Button>['iconLeft']>;
    translationId: TxKeyPath;
    translationValues?: Record<string, number>;
    isVisible: boolean;
}

interface AccountAssetsTabBarProps {
    activeTab: AccountAssetsTab;
    flowType: AccountAssetsFlow;
    networkType?: NetworkType;
    tokenCount: number;
    defiTokenCount: number;
    hiddenTokenCount: number;
    onTabChange: (tab: AccountAssetsTab) => void;
}

export const AccountAssetsTabBar = ({
    activeTab,
    flowType,
    networkType,
    tokenCount,
    defiTokenCount,
    hiddenTokenCount,
    onTabChange,
}: AccountAssetsTabBarProps) => {
    const { applyStyle } = useNativeStyles();
    const { scrollViewRef, handleTabLayout, handleScroll, handleScrollViewLayout } =
        useActiveTabScroll(activeTab);

    const tabsConfig: TabItem[] = useMemo(
        () => [
            {
                tab: 'tokens',
                icon: 'coins',
                translationId: 'moduleAccountManagement.accountAssetsScreen.tab.tokens',
                translationValues: { count: tokenCount },
                isVisible: true,
            },
            {
                tab: 'defi',
                icon: 'percent',
                translationId: 'moduleAccountManagement.accountAssetsScreen.tab.defi',
                translationValues: { count: defiTokenCount },
                isVisible: networkType === 'ethereum',
            },
            {
                tab: 'hidden',
                icon: 'eyeSlash',
                translationId: 'moduleAccountManagement.accountAssetsScreen.tab.hidden',
                translationValues: { count: hiddenTokenCount },
                isVisible: true,
            },
            {
                tab: 'inactive',
                icon: 'coinSlash',
                translationId: 'moduleAccountManagement.accountAssetsScreen.tab.inactive',
                isVisible: networkType === 'stellar' && flowType === 'assets',
            },
        ],
        [tokenCount, defiTokenCount, hiddenTokenCount, networkType, flowType],
    );

    return (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={applyStyle(scrollStyle)}
            contentContainerStyle={applyStyle(scrollContentStyle)}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={handleScrollViewLayout}
        >
            {tabsConfig
                .filter(({ isVisible }) => isVisible)
                .map(({ tab, icon, translationId, translationValues }) => (
                    <View key={tab} onLayout={handleTabLayout(tab)}>
                        <Button
                            intent="neutral"
                            priority={activeTab === tab ? 'primary' : 'secondary'}
                            size="medium"
                            iconLeft={icon}
                            onPress={() => onTabChange(tab)}
                        >
                            <Translation id={translationId} values={translationValues} />
                        </Button>
                    </View>
                ))}
        </ScrollView>
    );
};
