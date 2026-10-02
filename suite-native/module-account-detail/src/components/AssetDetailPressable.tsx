import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type AssetDetailPressableProps = {
    children: ReactNode;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetDetailPressable = ({
    children,
    networkSymbol,
    tokenContract,
}: AssetDetailPressableProps) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const isAssetFirstHomeTableEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });

    if (!isAssetFirstHomeTableEnabled) return children;

    const handlePress = () => {
        navigation.navigate(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { networkSymbol, tokenContract },
        });
    };

    return (
        <Pressable accessibilityRole="button" onPress={handlePress}>
            {children}
        </Pressable>
    );
};
