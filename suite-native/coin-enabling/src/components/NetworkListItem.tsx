import { type ReactNode } from 'react';
import { type AccessibilityRole, type AccessibilityState } from 'react-native';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Box, Card, PressableOpacity } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MainnetNetworkListItemContent } from './MainnetNetworkListItemContent';
import { TestnetNetworkListItemContent } from './TestnetNetworkListItemContent';

type NetworkListItemProps = {
    symbol: NetworkSymbol;
    accessory: ReactNode;
    onPress: () => void;
    accessibilityRole: AccessibilityRole;
    accessibilityState?: AccessibilityState;
    testID: string;
};

const wrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    paddingLeft: utils.spacings.sp12,
    paddingRight: utils.spacings.sp16,

    gap: utils.spacings.sp12,
    alignItems: 'center',
    flex: 1,
}));

export const NetworkListItem = ({
    symbol,
    accessory,
    onPress,
    accessibilityRole,
    accessibilityState,
    testID,
}: NetworkListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const network = getNetwork(symbol);
    const { testnet: isTestnet } = network;

    return (
        <Card noPadding>
            <PressableOpacity
                onPress={onPress}
                accessibilityRole={accessibilityRole}
                accessibilityState={accessibilityState}
                accessibilityLabel={network.name}
                testID={testID}
            >
                <Box style={applyStyle(wrapperStyle)} justifyContent="flex-start">
                    {isTestnet ? (
                        <TestnetNetworkListItemContent network={network} accessory={accessory} />
                    ) : (
                        <MainnetNetworkListItemContent network={network} accessory={accessory} />
                    )}
                </Box>
            </PressableOpacity>
        </Card>
    );
};
