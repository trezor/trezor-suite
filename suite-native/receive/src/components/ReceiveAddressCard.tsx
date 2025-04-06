import Animated, { Layout } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Box, Card, InlineAlertBoxProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AddressQRCode } from '@suite-native/qr-code';

import { UnverifiedAddress } from './UnverifiedAddress';

type ReceiveAddressCardProps = {
    address: string;
    isReceiveApproved: boolean;
    isUnverifiedAddressRevealed: boolean;
    symbol: NetworkSymbol;
    onShowAddress: () => void;
    isTokenAddress?: boolean;
};

export const ReceiveAddressCard = ({
    address,
    isUnverifiedAddressRevealed,
    isReceiveApproved,
    onShowAddress,
    symbol,
    isTokenAddress = false,
}: ReceiveAddressCardProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const { networkType, name: networkName } = getNetwork(symbol);

    const getCardAlertProps = (): InlineAlertBoxProps | undefined => {
        if (isReceiveApproved && !isPortfolioTrackerDevice && !isDeviceInViewOnlyMode) {
            return {
                title: <Translation id="moduleReceive.receiveAddressCard.alert.success" />,
                variant: 'success',
            };
        }
        if (symbol === 'ada' && isUnverifiedAddressRevealed) {
            return {
                title: (
                    <Translation id="moduleReceive.receiveAddressCard.alert.longCardanoAddress" />
                ),
                variant: 'info',
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
                variant: 'info',
            };
        }

        return undefined;
    };

    const cardAlertProps = getCardAlertProps();

    return (
        <Animated.View layout={Layout}>
            <Card alertProps={cardAlertProps}>
                <Box paddingVertical="sp8">
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
