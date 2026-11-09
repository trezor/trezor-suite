import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetHiddenReason,
    selectWalletAssetKey,
} from '@suite-common/assets';
import {
    DefinitionType,
    type TokenDefinitionsRootState,
    TokenManagementAction,
    selectAreCoinDefinitionsLoaded,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useAlert } from '@suite-native/alerts';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { AssetSettingsAction } from './AssetSettingsAction';

type AssetSettingsHideTokenActionProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    onClose: () => void;
};

export const AssetSettingsHideTokenAction = ({
    networkSymbol,
    tokenContract,
    onClose,
}: AssetSettingsHideTokenActionProps) => {
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const hiddenReason = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetHiddenReason(state, assetKey),
    );
    const displaySymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetDisplaySymbol(state, assetKey),
    );
    const areCoinDefinitionsLoaded = useSelector((state: TokenDefinitionsRootState) =>
        selectAreCoinDefinitionsLoaded(state, networkSymbol),
    );
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const { showToast } = useToast();
    const { showAlert } = useAlert();

    // Until the coin definitions load, every token reads as unrecognized, even one the user hid, so
    // neither showing nor hiding it would do what the label says.
    const isHiddenReasonPending = hiddenReason === 'unrecognized' && !areCoinDefinitionsLoaded;

    if (tokenContract === undefined || isHiddenReasonPending) return null;

    const isHidden = hiddenReason !== undefined;

    const toggleTokenVisibility = () => {
        analytics.report({
            type: events.assetsActionsEvent.name,
            payload: {
                action: isHidden ? 'show-token' : 'hide-token',
                networkSymbol,
                contractAddress: tokenContract,
            },
        });
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: networkSymbol,
                type: DefinitionType.COIN,
                status: isHidden ? TokenManagementAction.SHOW : TokenManagementAction.HIDE,
                contractAddress: tokenContract,
            }),
        );
        showToast({
            intent: 'neutral',
            icon: isHidden ? 'eye' : 'eyeSlash',
            message: (
                <Translation
                    id={
                        isHidden
                            ? 'moduleAssets.assetDetailScreen.settings.tokenShown'
                            : 'moduleAssets.assetDetailScreen.settings.tokenHidden'
                    }
                />
            ),
        });
    };

    const confirmShowUnrecognizedToken = () => {
        onClose();
        showAlert({
            title: (
                <Translation
                    id="moduleAssets.assetDetailScreen.settings.showUnrecognizedTokenAlert.title"
                    values={{ asset: displaySymbol }}
                />
            ),
            description: (
                <Translation id="moduleAssets.assetDetailScreen.settings.showUnrecognizedTokenAlert.description" />
            ),
            pictogramVariant: 'warning',
            primaryButtonTitle: (
                <Translation id="moduleAccountManagement.tokenSettings.showToken" />
            ),
            onPressPrimaryButton: toggleTokenVisibility,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            testID: '@asset-detail/settings/show-unrecognized-token-alert',
        });
    };

    return (
        <AssetSettingsAction
            iconName={isHidden ? 'eye' : 'eyeSlash'}
            label={
                <Translation
                    id={
                        isHidden
                            ? 'moduleAccountManagement.tokenSettings.showToken'
                            : 'moduleAccountManagement.tokenSettings.hideToken'
                    }
                />
            }
            onPress={
                hiddenReason === 'unrecognized'
                    ? confirmShowUnrecognizedToken
                    : toggleTokenVisibility
            }
            testID={`@asset-detail/settings/${isHidden ? 'show' : 'hide'}-token-button`}
        />
    );
};
