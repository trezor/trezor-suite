import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetKey,
    selectWalletAssetSignVerifyAccounts,
} from '@suite-common/assets';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
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

type AssetSettingsSignAndVerifyActionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onOpenSignAndVerifyAccounts: () => void;
    onClose: () => void;
};

export const AssetSettingsSignAndVerifyAction = ({
    networkSymbol,
    tokenContract,
    onOpenSignAndVerifyAccounts,
    onClose,
}: AssetSettingsSignAndVerifyActionProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const signAndVerifyAccounts = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSignVerifyAccounts(state, assetKey),
    );
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const navigation = useNavigation<NavigationProps>();

    if (isPortfolioTrackerDevice || signAndVerifyAccounts.length === 0) {
        return null;
    }

    const handleOpenSignAndVerify = () => {
        const [onlyAccount] = signAndVerifyAccounts;

        if (signAndVerifyAccounts.length === 1 && onlyAccount !== undefined) {
            onClose();
            navigation.navigate(RootStackRoutes.SignAndVerify, { accountKey: onlyAccount.key });

            return;
        }

        onOpenSignAndVerifyAccounts();
    };

    return (
        <AssetSettingsAction
            iconName="shieldWarning"
            label={
                <Translation id="moduleAccountManagement.accountSettingsScreen.signAndVerifyButton" />
            }
            onPress={handleOpenSignAndVerify}
            testID="@asset-detail/settings/sign-and-verify-button"
        />
    );
};
