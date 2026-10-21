import { useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { Box, IconButton } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { IconByCryptoId } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useExchangeAssetsSwitch } from '../../hooks/exchange/useExchangeAssetsSwitch';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';

type SwitchButtonContainerStyleProps = {
    buttonHeight: number | undefined;
};

const switchButtonContainerStyle = prepareNativeStyle<SwitchButtonContainerStyleProps>(
    (_, { buttonHeight }) =>
        buttonHeight === undefined
            ? { position: 'absolute', opacity: 0, pointerEvents: 'none' }
            : { alignItems: 'center', marginVertical: -buttonHeight / 2, zIndex: 1 },
);

export const ExchangeAssetsSwitchButton = () => {
    const form = useExchangeFormContext();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const { applyStyle } = useNativeStyles();
    const { cryptoIdToCoinName, cryptoIdToPlatformName } = useTradingUtils();
    const { canSwitch, isReceiveNetworkEnabled, switchAssets } = useExchangeAssetsSwitch(form);
    const receiveAsset = useWatch({ control: form.control, name: 'receiveAsset' });
    const [buttonHeight, setButtonHeight] = useState<number>();

    const handleButtonLayout = (event: LayoutChangeEvent) =>
        setButtonHeight(event.nativeEvent.layout.height);

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
        <Box style={applyStyle(switchButtonContainerStyle, { buttonHeight })}>
            <IconButton
                onLayout={handleButtonLayout}
                iconName="arrowsDownUp"
                size="medium"
                intent="neutral"
                priority="secondary"
                isDisabled={!canSwitch}
                onPress={handlePress}
                accessibilityLabel={translate(
                    'moduleTrading.assetSwitcher.buttonAccessibilityLabel',
                )}
                testID="@trading/exchange/switch-assets"
            />
        </Box>
    );
};
