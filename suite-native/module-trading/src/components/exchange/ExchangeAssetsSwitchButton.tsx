import { parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { IconButton } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { IconByCryptoId } from '@suite-native/trading-atoms';

import { useExchangeAssetsSwitch } from '../../hooks/exchange/useExchangeAssetsSwitch';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

export const ExchangeAssetsSwitchButton = () => {
    const form = useExchangeFormContext();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const { cryptoIdToCoinName, cryptoIdToPlatformName } = useTradingUtils();
    const { canSwitch, isReceiveNetworkEnabled, switchAssets } = useExchangeAssetsSwitch(form);
    const receiveAsset = useWatch({ control: form.control, name: 'receiveAsset' });

    const handlePress = () => {
        if (!receiveAsset) {
            return;
        }

        const { networkId, contractAddress } = parseCryptoId(receiveAsset.cryptoId);
        const network = contractAddress
            ? cryptoIdToPlatformName(networkId)
            : cryptoIdToCoinName(networkId);

        switchAssets();

        if (isReceiveNetworkEnabled) {
            return;
        }

        showAlert({
            customIcon: (
                <IconByCryptoId
                    cryptoId={receiveAsset.cryptoId}
                    tokenSymbol={receiveAsset.symbol}
                    size="large"
                    withNetwork
                />
            ),
            title: translate('moduleTrading.assetSwitcher.inactiveNetworkAlert.title'),
            description: translate('moduleTrading.assetSwitcher.inactiveNetworkAlert.description', {
                asset: receiveAsset.symbol,
                network,
            }),
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            primaryButtonColorProps: { intent: 'info', priority: 'primary' },
            isClosableByOutsidePress: true,
        });
    };

    return (
        <IconButton
            iconName="arrowsDownUp"
            size="medium"
            intent="neutral"
            priority="secondary"
            isDisabled={!canSwitch}
            onPress={handlePress}
            accessibilityLabel={translate('moduleTrading.assetSwitcher.buttonAccessibilityLabel')}
            testID="@trading/exchange/switch-assets"
        />
    );
};
