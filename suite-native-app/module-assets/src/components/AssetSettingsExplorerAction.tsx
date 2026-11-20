import { useSelector } from 'react-redux';

import {
    type AssetExplorerState,
    type HomeAssetTableState,
    selectWalletAssetExplorerUrl,
    selectWalletAssetKey,
} from '@suite-common/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { AssetSettingsAction } from './AssetSettingsAction';
import { AssetSettingsDivider } from './AssetSettingsDivider';

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
        <>
            <AssetSettingsDivider />
            <AssetSettingsAction
                iconName="arrowUpRight"
                label={<Translation id="moduleAssets.assetDetailScreen.settings.viewInExplorer" />}
                onPress={handleOpenExplorer}
                testID="@asset-detail/settings/explorer-button"
            />
        </>
    );
};
