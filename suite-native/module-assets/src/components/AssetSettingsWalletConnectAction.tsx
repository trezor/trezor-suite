import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type AppConnectionState,
    selectIsWalletConnectAvailable,
} from '@suite-native/module-connect-popup';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    AssetsStackParamList,
    AssetsStackRoutes.AssetDetail,
    RootStackParamList
>;

type AssetSettingsWalletConnectActionProps = {
    networkSymbol: NetworkSymbol;
    onClose: () => void;
};

export const AssetSettingsWalletConnectAction = ({
    networkSymbol,
    onClose,
}: AssetSettingsWalletConnectActionProps) => {
    const navigation = useNavigation<NavigationProps>();
    const isWalletConnectAvailable = useSelector((state: AppConnectionState) =>
        selectIsWalletConnectAvailable(state, networkSymbol),
    );

    if (!isWalletConnectAvailable) {
        return null;
    }

    const handleOpenWalletConnect = () => {
        onClose();
        navigation.navigate(RootStackRoutes.WalletConnectPair);
    };

    return (
        <PressableOpacity
            accessibilityRole="button"
            onPress={handleOpenWalletConnect}
            testID="@asset-detail/settings/wallet-connect-button"
        >
            <HStack alignItems="center" spacing="sp16" paddingVertical="sp12">
                <Icon name="walletConnect" size="medium" />
                <Text variant="body-md">
                    <Translation id="moduleConnectPopup.walletConnect.title" />
                </Text>
            </HStack>
        </PressableOpacity>
    );
};
