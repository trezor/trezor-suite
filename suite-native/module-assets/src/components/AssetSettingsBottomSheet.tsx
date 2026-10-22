import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    HStack,
    IconSquare,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type AssetSettingsBottomSheetProps = {
    ref: BottomSheetModalRef;
    assetDisplaySymbol: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onAccountsPress: () => void;
};

export const AssetSettingsBottomSheet = ({
    ref,
    assetDisplaySymbol,
    networkSymbol,
    tokenContract,
    onAccountsPress,
}: AssetSettingsBottomSheetProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const accountsCount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccountCount(state, assetKey),
    );

    return (
        <BottomSheetModal ref={ref} title={assetDisplaySymbol} isCloseDisplayed>
            <VStack spacing="sp24" paddingBottom="sp16">
                <HStack alignItems="center" justifyContent="space-between">
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id="moduleAssets.assetDetailScreen.settings.network" />
                    </Text>
                    <Text variant="body-md">{getNetwork(networkSymbol).name}</Text>
                </HStack>

                <PressableOpacity
                    accessibilityRole="button"
                    onPress={onAccountsPress}
                    testID="@asset-detail/settings/accounts-button"
                >
                    <HStack
                        alignItems="center"
                        justifyContent="space-between"
                        paddingVertical="sp12"
                    >
                        <HStack alignItems="center" spacing="sp16">
                            <IconSquare icon="wallet" size={36} />
                            <Text variant="body-md">
                                <Translation id="moduleAssets.assetDetailScreen.settings.accounts" />
                            </Text>
                        </HStack>
                        <HStack alignItems="center" spacing="sp16">
                            <Text variant="body-md">{accountsCount}</Text>
                            <Icon name="caretRight" color="contentSecondary" size="mediumLarge" />
                        </HStack>
                    </HStack>
                </PressableOpacity>
            </VStack>
        </BottomSheetModal>
    );
};
