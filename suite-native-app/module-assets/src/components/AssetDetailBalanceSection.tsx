import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetAmount,
    selectWalletAssetFiatValue,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { selectIsTokenFiatRateDisallowed } from '@suite-common/wallet-core';
import { areBaseCurrencyAmountsEqual } from '@suite-common/wallet-types';
import { Discreet, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountHeaderFormatter,
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';

import { useOpenAssetDetailAccounts } from './AssetDetailAccountsBottomSheetProvider';
import { AssetDetailSectionHeader } from './AssetDetailSectionHeader';

export const AssetDetailBalanceSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
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
    const accountCount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccountCount(state, assetKey),
    );
    const isFiatRateDisallowed = useSelector((state: TokenDefinitionsRootState) =>
        selectIsTokenFiatRateDisallowed(state, networkSymbol, tokenContract),
    );
    const openAccountsModal = useOpenAssetDetailAccounts();

    if (amount === undefined) {
        return null;
    }

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
                onPress={openAccountsModal}
                testID="@assets/asset-detail/all-accounts-button"
            />

            <VStack spacing="sp4">
                {!isFiatRateDisallowed && (
                    <Discreet textVariant="headline-sm">
                        <BaseCurrencyAmountHeaderFormatter
                            value={fiatValue ?? null}
                            variant="headline-sm"
                        />
                    </Discreet>
                )}
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
                        networkSymbol={networkSymbol}
                        contractAddress={tokenContract}
                        color="contentPrimary"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                )}
            </VStack>
        </VStack>
    );
};
