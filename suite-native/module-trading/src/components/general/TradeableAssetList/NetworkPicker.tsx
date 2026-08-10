import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Text, useBottomSheetControls } from '@suite-native/atoms';
import { selectDiscoverySupportedNetworks } from '@suite-native/discovery';
import { NetworkIcon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworksSheet } from './NetworksSheet';

export type NetworkPickerProps = {
    selectedNetwork: NetworkSymbol | undefined;
    onSelectNetwork: (symbol: NetworkSymbol | undefined) => void;
    testID?: string;
};

const pickerButtonStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp48,
}));

export const NetworkPicker = ({ selectedNetwork, onSelectNetwork, testID }: NetworkPickerProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const { isSheetVisible, hideSheet, showSheet } = useBottomSheetControls();
    const networks = useSelector(selectDiscoverySupportedNetworks);
    const selectedNetworkName = networks.find(({ symbol }) => symbol === selectedNetwork)?.name;
    const pickerLabel = translate('moduleTrading.tradeableAssetsSheet.networkPickerLabel');

    return (
        <>
            <Button
                style={applyStyle(pickerButtonStyle)}
                size="large"
                accessibilityLabel={selectedNetworkName ?? pickerLabel}
                accessibilityRole="button"
                onPress={showSheet}
                testID={testID}
                iconRight="caretDown"
                intent="neutral"
                priority="secondary"
                shouldWrapChildrenInText={!selectedNetwork}
            >
                {selectedNetwork ? (
                    <NetworkIcon symbol={selectedNetwork} size="extraLarge" />
                ) : (
                    <Text variant="body-md-strong">{pickerLabel}</Text>
                )}
            </Button>
            <NetworksSheet
                isVisible={isSheetVisible}
                networks={networks}
                selectedNetwork={selectedNetwork}
                onClose={hideSheet}
                onSelectNetwork={onSelectNetwork}
                testID={testID ? `${testID}/networks-sheet` : undefined}
            />
        </>
    );
};
