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
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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
    };

    return (
        <PressableOpacity
            accessibilityRole="button"
            onPress={handleToggleTokenVisibility}
            testID={`@asset-detail/settings/${isHiddenByUser ? 'show' : 'hide'}-token-button`}
        >
            <HStack alignItems="center" spacing="sp16" paddingVertical="sp12">
                <Icon name={isHiddenByUser ? 'eye' : 'eyeSlash'} size="medium" />
                <Text variant="body-md">
                    <Translation
                        id={
                            isHiddenByUser
                                ? 'moduleAccountManagement.tokenSettings.showToken'
                                : 'moduleAccountManagement.tokenSettings.hideToken'
                        }
                    />
                </Text>
            </HStack>
        </PressableOpacity>
    );
};
