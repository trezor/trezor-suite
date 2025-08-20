import { useCallback, useMemo, useState } from 'react';
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
    selectDeviceNetworksWithAssets,
    selectVisibleDeviceAccountsKeysByNetworkSymbol,
} from '@suite-native/assets/src/assetsSelectors';
import {
    AnimatedCard,
    Box,
    HStack,
    Text,
    VStack,
    cardVariantToColorsMap,
} from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { selectIsStakingEnabled } from '@suite-native/module-trading';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { selectDeviceAccountsWithStaking } from '@suite-native/staking';
import { TokensRootState, selectHasDeviceAnyTokensForNetwork } from '@suite-native/tokens';

import { StakingBannerBottomSheet } from './StakingBannerBottomSheet';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

const STAKING_BANNER_NETWORK_SYMBOL: NetworkSymbol = 'sol';

export const StakingBanner = () => {
    const navigation = useNavigation<NavigationProp>();

    const IsStakingEnabled = useSelector(selectIsStakingEnabled);

    const deviceNetworks = useSelectorDeepComparison(selectDeviceNetworksWithAssets);
    const deviceNetworksFiltered = useMemo(
        () => deviceNetworks.filter(network => network === STAKING_BANNER_NETWORK_SYMBOL),
        [deviceNetworks],
    );

    const hasAnyTokens = useSelector((state: TokensRootState) =>
        selectHasDeviceAnyTokensForNetwork(state, STAKING_BANNER_NETWORK_SYMBOL),
    );
    const accountsKeysForNetworkSymbol = useSelectorDeepComparison((state: AssetsRootState) =>
        selectVisibleDeviceAccountsKeysByNetworkSymbol(state, STAKING_BANNER_NETWORK_SYMBOL),
    );
    const accountsPerAsset = accountsKeysForNetworkSymbol.length;

    const apy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, STAKING_BANNER_NETWORK_SYMBOL),
    );
    const accountsWithStaking = useSelector((state: AssetsRootState) =>
        selectDeviceAccountsWithStaking(state, STAKING_BANNER_NETWORK_SYMBOL),
    );

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    const [selectedSymbol, setSelectedSymbol] = useState<NetworkSymbol | null>(null);

    const handleBannerPress = (symbol: NetworkSymbol) => {
        if (accountsPerAsset === 1 && !hasAnyTokens) {
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

    if (!IsStakingEnabled) return null;

    return (
        <Box>
            <VStack spacing="sp2" paddingVertical="sp16">
                <Text variant="titleSmall">
                    <Translation
                        id="moduleHome.stakingBanner.title"
                        values={{
                            networkSymbol: getNetworkDisplaySymbol(STAKING_BANNER_NETWORK_SYMBOL),
                        }}
                    />
                </Text>

                <Text variant="hint" color={cardVariantToColorsMap.normal.subtitleColor}>
                    <Translation
                        id="moduleHome.stakingBanner.subtitle"
                        values={{
                            networkSymbol: getNetworkDisplaySymbol(STAKING_BANNER_NETWORK_SYMBOL),
                        }}
                    />
                </Text>
            </VStack>
            <AnimatedCard noPadding layout={LinearTransition}>
                {deviceNetworksFiltered.map(symbol => (
                    <Animated.View
                        entering={isLoading ? FadeInDown : undefined}
                        layout={LinearTransition}
                        key={symbol}
                    >
                        <TouchableOpacity onPress={() => handleBannerPress(symbol)}>
                            <HStack
                                paddingHorizontal="sp16"
                                paddingVertical="sp12"
                                spacing="sp12"
                                alignItems="center"
                            >
                                <Box flexDirection="row" alignItems="center" flex={1}>
                                    <Box marginRight="sp16">
                                        <CryptoIcon symbol={symbol} />
                                    </Box>
                                    <Box>
                                        <Text>
                                            <Translation
                                                id="moduleHome.stakingBanner.bannerText"
                                                values={{
                                                    apy,
                                                    networkSymbol: getNetworkDisplaySymbol(symbol),
                                                    bold: (chunks: React.ReactNode) => (
                                                        <Text style={{ fontWeight: '700' }}>
                                                            {chunks}
                                                        </Text>
                                                    ),
                                                }}
                                            />
                                        </Text>
                                    </Box>
                                </Box>
                                <Icon name="caretRight" size="mediumLarge" color="iconSubdued" />
                            </HStack>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </AnimatedCard>
            {selectedSymbol && (
                <StakingBannerBottomSheet
                    data={accountsWithStaking}
                    onSelect={handleSelectStakingBannerAccount}
                    onClose={handleCloseBottomSheet}
                />
            )}
        </Box>
    );
};
