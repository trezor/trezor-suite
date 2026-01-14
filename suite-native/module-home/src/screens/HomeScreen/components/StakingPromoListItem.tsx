import { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    StakeRootState,
    selectHasRunningDiscovery,
    selectIsDeviceAuthorized,
    selectPoolStatsApyData,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    AssetsRootState,
    selectVisibleDeviceAccountsKeysByNetworkSymbol,
} from '@suite-native/assets/src/assetsSelectors';
import { AnimatedCard, Box, HStack, Text } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { selectDeviceAccountsWithStaking } from '@suite-native/staking';

import { StakingPromoBottomSheet } from './StakingPromoBottomSheet';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

type StakingPromoListItemProps = {
    networkSymbol: NetworkSymbol;
};

export const StakingPromoListItem = ({ networkSymbol }: StakingPromoListItemProps) => {
    const navigation = useNavigation<NavigationProp>();

    const isStakingEnabled = useFeatureFlag(FeatureFlag.IsStakingEnabled);

    const accountsKeysForNetworkSymbol = useSelectorDeepComparison((state: AssetsRootState) =>
        selectVisibleDeviceAccountsKeysByNetworkSymbol(state, networkSymbol),
    );
    const accountsPerAsset = accountsKeysForNetworkSymbol.length;

    const apy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, undefined, networkSymbol),
    );

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    const [selectedSymbol, setSelectedSymbol] = useState<NetworkSymbol | null>(null);

    const accountsWithStaking = useSelector(
        (state: AssetsRootState) =>
            selectedSymbol && selectDeviceAccountsWithStaking(state, selectedSymbol),
    );

    const handleBannerPress = (symbol: NetworkSymbol) => {
        if (accountsPerAsset === 1) {
            navigation.navigate(RootStackRoutes.StakingDetail, {
                accountKey: accountsKeysForNetworkSymbol[0],
            });

            return;
        }

        setSelectedSymbol(symbol);
    };

    const handleSelectStakingBannerAccount: (params: Account) => void = useCallback(
        ({ key }) => {
            navigation.navigate(RootStackRoutes.StakingDetail, {
                accountKey: key,
            });

            setSelectedSymbol(null);
        },
        [navigation, setSelectedSymbol],
    );

    const handleCloseBottomSheet = useCallback(() => {
        setSelectedSymbol(null);
    }, [setSelectedSymbol]);

    if (!isStakingEnabled) return null;

    return (
        <Box paddingVertical="sp6">
            <AnimatedCard noPadding layout={LinearTransition}>
                <Animated.View
                    entering={isLoading ? FadeInDown : undefined}
                    layout={LinearTransition}
                    key={networkSymbol}
                >
                    <TouchableOpacity onPress={() => handleBannerPress(networkSymbol)}>
                        <HStack
                            paddingHorizontal="sp16"
                            paddingVertical="sp12"
                            spacing="sp12"
                            alignItems="center"
                        >
                            <Box flexDirection="row" alignItems="center" flex={1}>
                                <Box marginRight="sp16">
                                    <CryptoIcon symbol={networkSymbol} />
                                </Box>

                                <Text>
                                    <Translation
                                        id="moduleHome.stakingPromo.bannerText"
                                        values={{
                                            apy,
                                            networkSymbol: getNetworkDisplaySymbol(networkSymbol),
                                            bold: (chunks: React.ReactNode) => (
                                                <Text variant="highlight">{chunks}</Text>
                                            ),
                                        }}
                                    />
                                </Text>
                            </Box>
                            <Icon name="caretRight" size="mediumLarge" color="iconSubdued" />
                        </HStack>
                    </TouchableOpacity>
                </Animated.View>
            </AnimatedCard>
            {selectedSymbol && (
                <StakingPromoBottomSheet
                    data={accountsWithStaking}
                    onSelect={handleSelectStakingBannerAccount}
                    onClose={handleCloseBottomSheet}
                />
            )}
        </Box>
    );
};
