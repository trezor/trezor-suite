import Animated, { Layout } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { Box, Card } from '@suite-native/atoms';
import { AddressQRCode } from '@suite-native/qr-code';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

import { UnverifiedAddress } from './UnverifiedAddress';

type ReceiveAddressCardProps = {
    address: string;
    isReceiveApproved: boolean;
    isUnverifiedAddressRevealed: boolean;
    networkSymbol: NetworkSymbol;
    onShowAddress: () => void;
    isEthereumTokenAddress?: boolean;
};

export const ReceiveAddressCard = ({
    address,
    isUnverifiedAddressRevealed,
    isReceiveApproved,
    onShowAddress,
    networkSymbol,
    isEthereumTokenAddress = false,
}: ReceiveAddressCardProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const { networkType } = networks[networkSymbol];

    const getCardAlertProps = () => {
        if (isReceiveApproved && !isPortfolioTrackerDevice && !isDeviceInViewOnlyMode) {
            return {
                alertTitle: <Translation id="moduleReceive.receiveAddressCard.alert.success" />,
                alertVariant: 'success',
            } as const;
        }
        if (networkSymbol === 'ada' && isUnverifiedAddressRevealed) {
            return {
                alertTitle: (
                    <Translation id="moduleReceive.receiveAddressCard.alert.longCardanoAddress" />
                ),
                alertVariant: 'info',
            } as const;
        }
        if (isEthereumTokenAddress) {
            return {
                alertTitle: (
                    <Translation id="moduleReceive.receiveAddressCard.alert.ethereumToken" />
                ),
                alertVariant: 'info',
            } as const;
        }

        return { alertTitle: undefined, alertVariant: undefined } as const;
    };

    const cardAlertProps = getCardAlertProps();

    return (
        <Animated.View layout={Layout}>
            <Card {...cardAlertProps}>
                <Box paddingVertical="small">
                    {isReceiveApproved ? (
                        <AddressQRCode address={address} />
                    ) : (
                        <UnverifiedAddress
                            address={address}
                            isAddressRevealed={isUnverifiedAddressRevealed}
                            isCardanoAddress={networkType === 'cardano'}
                            onShowAddress={onShowAddress}
                        />
                    )}
                </Box>
            </Card>
        </Animated.View>
    );
};
