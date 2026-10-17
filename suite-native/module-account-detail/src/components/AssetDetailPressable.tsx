import { type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import {
    type AssetAccountsRootState,
    type WalletAssetKey,
    selectDeviceAssetAccounts,
    selectHiddenAssetAccountKeySet,
} from '@suite-common/wallet-core';
import {
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type AssetDetailPressableProps = {
    assetKey: WalletAssetKey;
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
};

export const AssetDetailPressable = ({ assetKey, children, style }: AssetDetailPressableProps) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const isAssetFirstHomeTableEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
    const assetAccounts = useSelector((state: AssetAccountsRootState) =>
        selectDeviceAssetAccounts(state),
    );
    const hiddenAssetAccountKeys = useSelector((state: AssetAccountsRootState) =>
        selectHiddenAssetAccountKeySet(state),
    );
    const hasShownAsset = assetAccounts.some(
        assetAccount =>
            assetAccount.assetKey === assetKey &&
            !hiddenAssetAccountKeys.has(assetAccount.assetAccountKey),
    );

    if (!isAssetFirstHomeTableEnabled || !hasShownAsset) return children;

    const handlePress = () => {
        navigation.navigate(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { assetKey },
        });
    };

    return (
        <Pressable accessibilityRole="button" onPress={handlePress} style={style}>
            {children}
        </Pressable>
    );
};
