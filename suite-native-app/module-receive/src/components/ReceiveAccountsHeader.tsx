import { type AssetId } from '@suite-common/tokens';
import { getNetwork } from '@suite-common/wallet-config';
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
    assetId: AssetId;
    closeActionType: CloseActionType;
};

export const ReceiveAccountsHeader = ({ assetId, closeActionType }: ReceiveAccountsHeaderProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { networkSymbol, contractAddress } = assetId;
    const networkName = contractAddress ? getNetwork(networkSymbol).name : undefined;
    const assetName = <AssetName networkSymbol={networkSymbol} contractAddress={contractAddress} />;

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
