import { ScrollView } from 'react-native';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type AccountAssetsTab = 'tokens' | 'defi' | 'hidden';

const scrollStyle = prepareNativeStyle(() => ({
    flexGrow: 0,
}));

const scrollContentStyle = prepareNativeStyle(({ spacings }) => ({
    alignItems: 'flex-start',
    gap: spacings.sp12,
    paddingHorizontal: spacings.sp16,
    paddingVertical: spacings.sp8,
}));

type AccountAssetsTabBarProps = {
    activeTab: AccountAssetsTab;
    tokenCount: number;
    defiTokenCount: number;
    onTabChange: (tab: AccountAssetsTab) => void;
};

export const AccountAssetsTabBar = ({
    activeTab,
    tokenCount,
    defiTokenCount,
    onTabChange,
}: AccountAssetsTabBarProps) => {
    const { applyStyle } = useNativeStyles();
    const getTabPriority = (tab: AccountAssetsTab) => (activeTab === tab ? 'primary' : 'secondary');
    const handleTabPress = (tab: AccountAssetsTab) => () => onTabChange(tab);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={applyStyle(scrollStyle)}
            contentContainerStyle={applyStyle(scrollContentStyle)}
        >
            <Button
                intent="neutral"
                priority={getTabPriority('tokens')}
                size="medium"
                iconLeft="coins"
                onPress={handleTabPress('tokens')}
            >
                <Translation
                    id="moduleAccountManagement.accountAssetsScreen.tab.tokens"
                    values={{ count: tokenCount }}
                />
            </Button>
            {defiTokenCount > 0 && (
                <Button
                    intent="neutral"
                    priority={getTabPriority('defi')}
                    size="medium"
                    iconLeft="percent"
                    onPress={handleTabPress('defi')}
                >
                    <Translation
                        id="moduleAccountManagement.accountAssetsScreen.tab.defi"
                        values={{ count: defiTokenCount }}
                    />
                </Button>
            )}
            <Button
                intent="neutral"
                priority={getTabPriority('hidden')}
                size="medium"
                iconLeft="eyeSlash"
                onPress={handleTabPress('hidden')}
            >
                <Translation id="moduleAccountManagement.accountAssetsScreen.tab.hidden" />
            </Button>
        </ScrollView>
    );
};
