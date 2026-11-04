import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { BottomSheetModal, type BottomSheetModalRef, VStack } from '@suite-native/atoms';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { TokenSymbol } from '@suite-native/tokens';

import { AssetSettingsAccountsAction } from './AssetSettingsAccountsAction';
import { AssetSettingsDivider } from './AssetSettingsDivider';
import { AssetSettingsExplorerAction } from './AssetSettingsExplorerAction';
import { AssetSettingsHideTokenAction } from './AssetSettingsHideTokenAction';
import { AssetSettingsNetworkSection } from './AssetSettingsNetworkSection';
import { AssetSettingsTokenDetailsSection } from './AssetSettingsTokenDetailsSection';
import { AssetSettingsWalletConnectAction } from './AssetSettingsWalletConnectAction';

type AssetSettingsBottomSheetProps = {
    ref: BottomSheetModalRef;
    onOpenAccounts: () => void;
    onClose: () => void;
};

export const AssetSettingsBottomSheet = ({
    ref,
    onOpenAccounts,
    onClose,
}: AssetSettingsBottomSheetProps) => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const tokenInfo = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={
                tokenContract ? (
                    <TokenSymbol
                        isTruncated
                        isInline
                        networkSymbol={networkSymbol}
                        tokenContract={tokenContract}
                        variant="headline-sm"
                    />
                ) : (
                    getNetworkDisplaySymbol(networkSymbol)
                )
            }
            isCloseDisplayed
        >
            <VStack spacing="sp24" paddingBottom="sp16">
                <VStack spacing="sp6">
                    <AssetSettingsNetworkSection networkSymbol={networkSymbol} />
                    <AssetSettingsDivider />
                </VStack>
                {tokenInfo && (
                    <VStack spacing="sp6">
                        <AssetSettingsTokenDetailsSection
                            networkSymbol={networkSymbol}
                            tokenContract={tokenContract}
                        />
                        <AssetSettingsDivider />
                    </VStack>
                )}
                <AssetSettingsAccountsAction
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
                    onOpenAccounts={onOpenAccounts}
                />
                <AssetSettingsWalletConnectAction networkSymbol={networkSymbol} onClose={onClose} />
                <AssetSettingsHideTokenAction
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
                    onClose={onClose}
                />
                <AssetSettingsExplorerAction
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
                    onClose={onClose}
                />
            </VStack>
        </BottomSheetModal>
    );
};
