import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
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

import { AssetSettingsAction } from './AssetSettingsAction';

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
        <AssetSettingsAction
            iconName="walletConnect"
            label={<Translation id="moduleConnectPopup.walletConnect.title" />}
            onPress={handleOpenWalletConnect}
            testID="@asset-detail/settings/wallet-connect-button"
        />
    );
};
