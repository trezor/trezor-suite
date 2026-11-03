import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type AssetsRootState,
    type HomeAssetTableState,
    selectAssetTokenInfo,
    selectWalletAssetHoldings,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
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

type AssetDetailAccountsBottomSheetProps = {
    ref: BottomSheetModalRef;
};

export const AssetDetailAccountsBottomSheet = ({ ref }: AssetDetailAccountsBottomSheetProps) => {
    const navigation = useNavigation<NavigationProps>();
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const tokenInfo = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const assetAccounts = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetHoldings(state, assetKey),
    );

    const handleAccountPress = (accountKey: AccountKey) => {
        if (ref && 'current' in ref && ref.current) {
            ref.current.dismiss();
        }

        navigation.navigate(RootStackRoutes.AccountOverview, { accountKey });
    };

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="moduleAssets.assetDetailScreen.settings.accounts" />}
            subtitle={
                <Translation
                    id="moduleAssets.assetDetailScreen.accountsSheet.subtitle"
                    values={{
                        assetName: getDisplaySymbol(
                            tokenInfo?.symbol ?? networkSymbol,
                            tokenContract,
                        ),
                        networkName: getNetwork(networkSymbol).name,
                    }}
                />
            }
            isCloseDisplayed
        >
            <VStack marginTop="sp16">
                <Card noPadding>
                    {assetAccounts.map(assetAccount => (
                        <AssetDetailAccountListItem
                            key={assetAccount.assetAccountKey}
                            assetAccount={assetAccount}
                            onAccountPress={handleAccountPress}
                        />
                    ))}
                </Card>
            </VStack>
        </BottomSheetModal>
    );
};
