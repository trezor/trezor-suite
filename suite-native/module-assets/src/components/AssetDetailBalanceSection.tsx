import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetAmount,
    selectWalletAssetFiatValue,
    selectWalletAssetKey,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { areBaseCurrencyAmountsEqual } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountHeaderFormatter,
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    AccountsStackRoutes,
    AppTabsRoutes,
    type AssetsStackParamList,
    type AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { AssetDetailSectionHeader } from './AssetDetailSectionHeader';

type NavigationProps = StackToStackCompositeNavigationProps<
    AssetsStackParamList,
    AssetsStackRoutes.AssetDetail,
    RootStackParamList
>;

export const AssetDetailBalanceSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const navigation = useNavigation<NavigationProps>();
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const amount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAmount(state, assetKey),
    );
    const fiatValue = useSelector(
        (state: HomeAssetTableState) => selectWalletAssetFiatValue(state, assetKey),
        areBaseCurrencyAmountsEqual,
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );
    const accountCount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccountCount(state, assetKey),
    );

    if (amount === undefined) {
        return null;
    }

    const handleAccountsPress = () =>
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.AccountsStack,
            params: {
                screen: AccountsStackRoutes.Accounts,
                params: { networksFilter: [networkSymbol] },
            },
        });

    return (
        <VStack paddingHorizontal="sp20" spacing="sp16">
            <AssetDetailSectionHeader
                title={
                    <Translation id="moduleAssets.assetDetailScreen.balanceSection.balanceTitle" />
                }
                linkLabel={
                    <Translation
                        id="moduleAssets.assetDetailScreen.balanceSection.allAccountsButton"
                        values={{ count: accountCount }}
                    />
                }
                onPress={handleAccountsPress}
                testID="@assets/asset-detail/all-accounts-button"
            />

            <VStack spacing="sp4">
                <BaseCurrencyAmountHeaderFormatter
                    value={fiatValue ?? null}
                    variant="headline-sm"
                />
                {tokenContract === undefined ? (
                    <CompactCryptoAmountFormatter
                        value={amount}
                        symbol={networkSymbol}
                        color="contentPrimary"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                ) : (
                    <CompactTokenAmountFormatter
                        value={asDecimalTokenAmount(amount)}
                        tokenSymbol={tokenSymbol}
                        tokenDecimals={tokenDecimals}
                        color="contentPrimary"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                )}
            </VStack>
        </VStack>
    );
};
