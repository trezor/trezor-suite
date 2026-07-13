import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { InlineAlertBox, type InlineAlertBoxProps, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { StaticSessionId } from '@trezor/connect';

import { AddressQRCode } from './AddressQRCode';

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
        <VStack spacing="sp16" flex={1}>
            <AddressQRCode
                accountDescriptor={accountDescriptor}
                address={address}
                deviceStaticSessionId={deviceStaticSessionId}
                networkSymbol={symbol}
                showLabelEdit={!isTokenAddress}
            />
            {cardAlertProps && <InlineAlertBox {...cardAlertProps} />}
        </VStack>
    );
};
