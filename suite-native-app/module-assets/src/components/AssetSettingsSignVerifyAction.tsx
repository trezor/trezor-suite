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

type AssetSettingsSignVerifyActionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onOpenSignVerifyAccounts: () => void;
    onClose: () => void;
};

export const AssetSettingsSignVerifyAction = ({
    networkSymbol,
    tokenContract,
    onOpenSignVerifyAccounts,
    onClose,
}: AssetSettingsSignVerifyActionProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const signVerifyAccounts = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSignVerifyAccounts(state, assetKey),
    );
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const navigation = useNavigation<NavigationProps>();

    if (isPortfolioTrackerDevice || signVerifyAccounts.length === 0) {
        return null;
    }

    const handleOpenSignVerify = () => {
        const [onlyAccount] = signVerifyAccounts;

        if (signVerifyAccounts.length === 1 && onlyAccount !== undefined) {
            onClose();
            navigation.navigate(RootStackRoutes.SignVerify, { accountKey: onlyAccount.key });

            return;
        }

        onOpenSignVerifyAccounts();
    };

    return (
        <AssetSettingsAction
            iconName="shieldWarning"
            label={
                <Translation id="moduleAccountManagement.accountSettingsScreen.signAndVerifyButton" />
            }
            onPress={handleOpenSignVerify}
            testID="@asset-detail/settings/sign-verify-button"
        />
    );
};
