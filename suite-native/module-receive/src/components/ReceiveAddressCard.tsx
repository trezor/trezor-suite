import Animated, { Layout } from 'react-native-reanimated';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { AddressQRCode } from '@suite-native/address';
import { Box, Card, type InlineAlertBoxProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { StaticSessionId } from '@trezor/connect';

type ReceiveAddressCardProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    symbol: NetworkSymbol;
    isTokenAddress?: boolean;
};

export const ReceiveAddressCard = ({
    accountDescriptor,
    address,
    deviceStaticSessionId,
    symbol,
    isTokenAddress = false,
}: ReceiveAddressCardProps) => {
    const { name: networkName } = getNetwork(symbol);

    const getCardAlertProps = (): InlineAlertBoxProps | undefined => {
        if (symbol === 'ada') {
            return {
                title: (
                    <Translation id="moduleReceive.receiveAddressCard.alert.longCardanoAddress" />
                ),
                intent: 'info',
            };
        }
        if (isTokenAddress) {
            return {
                title: (
                    <Translation
                        id="moduleReceive.receiveAddressCard.alert.token"
                        values={{ networkName }}
                    />
                ),
                intent: 'info',
            };
        }

        return undefined;
    };

    const cardAlertProps = getCardAlertProps();

    return (
        <Animated.View layout={Layout}>
            <Card alertProps={cardAlertProps}>
                <Box paddingVertical="sp8">
                    <AddressQRCode
                        accountDescriptor={accountDescriptor}
                        address={address}
                        deviceStaticSessionId={deviceStaticSessionId}
                        networkSymbol={symbol}
                        showLabelEdit={!isTokenAddress}
                    />
                </Box>
            </Card>
        </Animated.View>
    );
};
