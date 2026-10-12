import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import {
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type AssetDetailPressableProps = {
    assetKey: WalletAssetKey;
    children: ReactNode;
};

export const AssetDetailPressable = ({ assetKey, children }: AssetDetailPressableProps) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const isAssetFirstHomeTableEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });

    if (!isAssetFirstHomeTableEnabled) return children;

    const handlePress = () => {
        navigation.navigate(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { assetKey },
        });
    };

    return (
        <Pressable accessibilityRole="button" onPress={handlePress}>
            {children}
        </Pressable>
    );
};
