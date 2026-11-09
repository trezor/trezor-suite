import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

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
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const AssetDetailHiddenBanner = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
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
    const { dispatch } = useServices(injectDispatch);

    if (tokenContract === undefined || hiddenReason === undefined) {
        return null;
    }

    if (hiddenReason === 'unrecognized') {
        // Until the coin definitions load, every token reads as unrecognized, even a legitimate one.
        if (!areCoinDefinitionsLoaded) {
            return null;
        }

        return (
            <BannerFull
                marginHorizontal="sp20"
                intent="warning"
                title={
                    <Translation id="moduleAssets.assetDetailScreen.hiddenBanner.suspiciousTitle" />
                }
                description={
                    <Translation id="moduleAssets.assetDetailScreen.hiddenBanner.suspiciousDescription" />
                }
                testID="@asset-detail/suspicious-token-banner"
            />
        );
    }

    const showToken = () =>
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: networkSymbol,
                contractAddress: tokenContract,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );

    return (
        <BannerFull
            marginHorizontal="sp20"
            intent="info"
            iconName="eyeSlash"
            title={<Translation id="moduleAssets.assetDetailScreen.hiddenBanner.hiddenTitle" />}
            description={
                <Translation
                    id="moduleAssets.assetDetailScreen.hiddenBanner.hiddenDescription"
                    values={{ asset: displaySymbol }}
                />
            }
            primaryButtonLabel={
                <Translation id="moduleAccountManagement.tokenSettings.showToken" />
            }
            primaryButtonProps={{ iconLeft: 'eye' }}
            onPressPrimaryButton={showToken}
            testID="@asset-detail/hidden-token-banner"
        />
    );
};
