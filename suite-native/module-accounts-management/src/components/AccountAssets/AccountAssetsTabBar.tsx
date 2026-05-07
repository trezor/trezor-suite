import { type ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useActiveTabScroll } from './useActiveTabScroll';

export type AccountAssetsTab = 'tokens' | 'defi' | 'hidden' | 'inactive';

const scrollStyle = prepareNativeStyle(() => ({
    flexGrow: 0,
}));

const scrollContentStyle = prepareNativeStyle(({ spacings }) => ({
    alignItems: 'flex-start',
    gap: spacings.sp12,
    paddingHorizontal: spacings.sp16,
    paddingVertical: spacings.sp8,
}));

type TabItem = {
    tab: AccountAssetsTab;
    icon: NonNullable<ComponentProps<typeof Button>['iconLeft']>;
    translationId: TxKeyPath;
    translationValues?: Record<string, number>;
    isVisible: boolean;
};

type AccountAssetsTabBarProps = {
    activeTab: AccountAssetsTab;
    tokenCount: number;
    defiTokenCount: number;
    showInactiveTab: boolean;
    onTabChange: (tab: AccountAssetsTab) => void;
};

const getTabsConfig = (
    tokenCount: number,
    defiTokenCount: number,
    showInactiveTab: boolean,
): TabItem[] => [
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
        isVisible: defiTokenCount > 0,
    },
    {
        tab: 'hidden',
        icon: 'eyeSlash',
        translationId: 'moduleAccountManagement.accountAssetsScreen.tab.hidden',
        isVisible: true,
    },
    {
        tab: 'inactive',
        icon: 'coinSlash',
        translationId: 'moduleAccountManagement.accountAssetsScreen.tab.inactive',
        isVisible: showInactiveTab,
    },
];

export const AccountAssetsTabBar = ({
    activeTab,
    tokenCount,
    defiTokenCount,
    showInactiveTab,
    onTabChange,
}: AccountAssetsTabBarProps) => {
    const { applyStyle } = useNativeStyles();
    const { scrollViewRef, handleTabLayout, handleScroll, handleScrollViewLayout } =
        useActiveTabScroll(activeTab);

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
            {getTabsConfig(tokenCount, defiTokenCount, showInactiveTab)
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
