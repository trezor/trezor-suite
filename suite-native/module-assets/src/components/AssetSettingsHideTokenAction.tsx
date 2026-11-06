import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetHiddenReason,
    selectWalletAssetKey,
} from '@suite-common/assets';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { AssetSettingsAction } from './AssetSettingsAction';

type AssetSettingsHideTokenActionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetSettingsHideTokenAction = ({
    networkSymbol,
    tokenContract,
}: AssetSettingsHideTokenActionProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const hiddenReason = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetHiddenReason(state, assetKey),
    );
    const { dispatch } = useServices(injectDispatch);
    const { showToast } = useToast();

    if (tokenContract === undefined || hiddenReason === 'unrecognized') return null;

    const isHiddenByUser = hiddenReason === 'hiddenByUser';

    const handleToggleTokenVisibility = () => {
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: networkSymbol,
                type: DefinitionType.COIN,
                status: isHiddenByUser ? TokenManagementAction.SHOW : TokenManagementAction.HIDE,
                contractAddress: tokenContract,
            }),
        );
        showToast({
            intent: 'neutral',
            icon: isHiddenByUser ? 'eye' : 'eyeSlash',
            message: (
                <Translation
                    id={
                        isHiddenByUser
                            ? 'moduleAssets.assetDetailScreen.settings.tokenShown'
                            : 'moduleAssets.assetDetailScreen.settings.tokenHidden'
                    }
                />
            ),
        });
    };

    return (
        <AssetSettingsAction
            iconName={isHiddenByUser ? 'eye' : 'eyeSlash'}
            label={
                <Translation
                    id={
                        isHiddenByUser
                            ? 'moduleAccountManagement.tokenSettings.showToken'
                            : 'moduleAccountManagement.tokenSettings.hideToken'
                    }
                />
            }
            onPress={handleToggleTokenVisibility}
            testID={`@asset-detail/settings/${isHiddenByUser ? 'show' : 'hide'}-token-button`}
        />
    );
};
