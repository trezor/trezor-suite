import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetKey,
    selectWalletAssetSignVerifyAccounts,
} from '@suite-common/assets';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { BottomSheetModal, type BottomSheetModalRef, Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { AssetDetailAccountListItem } from './AssetDetailAccountListItem';

type NavigationProps = StackToStackCompositeNavigationProps<
    AssetsStackParamList,
    AssetsStackRoutes.AssetDetail,
    RootStackParamList
>;

type AssetDetailSignVerifyBottomSheetProps = {
    ref: BottomSheetModalRef;
    onClose: () => void;
};

export const AssetDetailSignVerifyBottomSheet = ({
    ref,
    onClose,
}: AssetDetailSignVerifyBottomSheetProps) => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const signVerifyAccounts = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSignVerifyAccounts(state, assetKey),
    );
    const navigation = useNavigation<NavigationProps>();

    const handleAccountPress = (accountKey: AccountKey) => {
        onClose();
        navigation.navigate(RootStackRoutes.SignVerify, { accountKey });
    };

    return (
        <BottomSheetModal
            ref={ref}
            title={
                <Translation id="moduleAccountManagement.accountSettingsScreen.signAndVerifyButton" />
            }
            subtitle={getNetwork(networkSymbol).name}
            isCloseDisplayed
        >
            <VStack marginTop="sp16">
                <Card noPadding>
                    {signVerifyAccounts.map(account => (
                        <AssetDetailAccountListItem
                            key={account.key}
                            accountKey={account.key}
                            contractAddress={undefined}
                            onAccountPress={handleAccountPress}
                        />
                    ))}
                </Card>
            </VStack>
        </BottomSheetModal>
    );
};
