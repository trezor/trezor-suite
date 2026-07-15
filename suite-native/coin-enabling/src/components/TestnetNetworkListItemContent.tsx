import { type ReactNode } from 'react';

import { type Network } from '@suite-common/wallet-config';
import { HStack, Text } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';

import { NetworkBackendsButton } from './NetworkBackendsButton';

type NetworkListItemContentProps = {
    network: Network;
    accessory: ReactNode;
};

export const TestnetNetworkListItemContent = ({
    network,
    accessory,
}: NetworkListItemContentProps) => {
    const { symbol, name: networkName } = network;

    return (
        <HStack spacing="sp12" alignItems="center">
            <NetworkIcon symbol={symbol} size={24} />
            <HStack flex={1} spacing="sp12" justifyContent="space-between" alignItems="center">
                <Text variant="body-sm-strong">{networkName}</Text>
                <HStack spacing="sp16" alignItems="center">
                    <NetworkBackendsButton symbol={symbol} />
                    {accessory}
                </HStack>
            </HStack>
        </HStack>
    );
};
