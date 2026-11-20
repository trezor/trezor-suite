import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isWalletConnectSupportedNetwork } from '@suite-common/walletconnect';
import { selectIsAppConnectionAvailable } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
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
    const isAppConnectionAvailable = useSelector(selectIsAppConnectionAvailable);

    if (!isWalletConnectSupportedNetwork(networkSymbol) || !isAppConnectionAvailable) {
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
