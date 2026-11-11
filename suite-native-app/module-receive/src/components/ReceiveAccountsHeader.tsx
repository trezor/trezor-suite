import { getGlobalReceiveAssetDescriptionValues } from '@suite-common/receive';
import type { TradingAssetOption } from '@suite-common/trading';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { AssetName } from '@suite-native/assets';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

type ReceiveAccountsHeaderProps = {
    asset: TradingAssetOption;
    closeActionType: CloseActionType;
};

export const ReceiveAccountsHeader = ({ asset, closeActionType }: ReceiveAccountsHeaderProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { networkName } = getGlobalReceiveAssetDescriptionValues(asset);
    const assetName = (
        <AssetName
            networkSymbol={asset.networkSymbol}
            contractAddress={asset.isNativeToken ? undefined : asset.contractAddress}
        />
    );

    const closeAction = () => {
        analytics.report({
            type: events.receiveOptionsScreenEvent.name,
            payload: { option: 'close' },
        });
        navigateToInitialScreen();
    };

    return (
        <ScreenHeader
            customContent={
                <>
                    <Text variant="body-md-strong">
                        <Translation id="moduleReceive.receiveTitle" />
                    </Text>
                    <Text numberOfLines={1}>
                        {networkName ? (
                            <Translation
                                id="moduleReceive.receiveDescription"
                                values={{ assetName, networkName }}
                            />
                        ) : (
                            assetName
                        )}
                    </Text>
                </>
            }
            closeActionType={closeActionType}
            closeAction={closeActionType === 'close' ? closeAction : undefined}
        />
    );
};
