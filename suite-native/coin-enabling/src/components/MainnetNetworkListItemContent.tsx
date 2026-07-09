import { type ReactNode } from 'react';

import { type Network } from '@suite-common/wallet-config';
import { Box, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoIconSet } from './CryptoIconSet';
import { NetworkBackendsButton } from './NetworkBackendsButton';
import { RepresentativeAssetsConnectorSvg } from './RepresentativeAssetsConnectorSvg';

type NetworkListItemContentProps = {
    network: Network;
    accessory: ReactNode;
};

const dividerStyle = prepareNativeStyle(utils => ({
    marginRight: -utils.spacings.sp16,
}));

export const MainnetNetworkListItemContent = ({
    network,
    accessory,
}: NetworkListItemContentProps) => {
    const { applyStyle } = useNativeStyles();
    const { name: networkName, symbol } = network;

    return (
        <HStack spacing="sp8">
            <Box>
                <VStack justifyContent="flex-start" flex={1}>
                    <NetworkIcon symbol={symbol} size="extraLarge" />

                    <Box paddingLeft="sp12">
                        <RepresentativeAssetsConnectorSvg />
                    </Box>
                </VStack>
            </Box>
            <VStack flex={1} spacing="sp8">
                <VStack justifyContent="flex-start" spacing="sp16">
                    <HStack
                        spacing="sp12"
                        justifyContent="space-between"
                        alignItems="center"
                        flex={1}
                    >
                        <Text variant="body-sm-strong" numberOfLines={1}>
                            {networkName}
                        </Text>
                        {accessory}
                    </HStack>
                    <Divider style={applyStyle(dividerStyle)} />
                </VStack>

                <HStack spacing="sp12" justifyContent="space-between" alignItems="center">
                    <CryptoIconSet symbol={symbol} />
                    <NetworkBackendsButton symbol={symbol} />
                </HStack>
            </VStack>
        </HStack>
    );
};
