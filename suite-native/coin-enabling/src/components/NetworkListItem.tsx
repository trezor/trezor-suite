import { type ReactNode } from 'react';
import { type AccessibilityRole } from 'react-native';

import { type RepresentativeAsset } from '@suite-common/token-definitions';
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
    testID: string;
    representativeAssets?: readonly RepresentativeAsset[];
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
    testID,
    representativeAssets,
}: NetworkListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const network = getNetwork(symbol);
    const { testnet: isTestnet } = network;

    return (
        <Card noPadding>
            <PressableOpacity
                onPress={onPress}
                accessibilityRole={accessibilityRole}
                testID={testID}
            >
                <Box style={applyStyle(wrapperStyle)} justifyContent="flex-start">
                    {isTestnet ? (
                        <TestnetNetworkListItemContent network={network} accessory={accessory} />
                    ) : (
                        <MainnetNetworkListItemContent
                            network={network}
                            accessory={accessory}
                            representativeAssets={representativeAssets}
                        />
                    )}
                </Box>
            </PressableOpacity>
        </Card>
    );
};
