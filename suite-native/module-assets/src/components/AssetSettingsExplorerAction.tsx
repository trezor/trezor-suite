import { useSelector } from 'react-redux';

import {
    type AssetExplorerState,
    type HomeAssetTableState,
    selectWalletAssetExplorerUrl,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

type AssetSettingsExplorerActionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onClose: () => void;
};

export const AssetSettingsExplorerAction = ({
    networkSymbol,
    tokenContract,
    onClose,
}: AssetSettingsExplorerActionProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const explorerUrl = useSelector((state: AssetExplorerState) =>
        selectWalletAssetExplorerUrl(state, assetKey),
    );
    const openLink = useOpenLink();

    if (explorerUrl === undefined) return null;

    const handleOpenExplorer = () => {
        onClose();
        openLink(explorerUrl);
    };

    return (
        <PressableOpacity
            accessibilityRole="button"
            onPress={handleOpenExplorer}
            testID="@asset-detail/settings/explorer-button"
        >
            <HStack alignItems="center" spacing="sp16" paddingVertical="sp12">
                <Icon name="arrowUpRight" size="medium" />
                <Text variant="body-md">
                    <Translation id="moduleAssets.assetDetailScreen.settings.viewInExplorer" />
                </Text>
            </HStack>
        </PressableOpacity>
    );
};
