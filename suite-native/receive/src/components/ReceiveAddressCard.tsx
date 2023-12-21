import Animated, { Layout } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { Box, Card } from '@suite-native/atoms';
import { AddressQRCode } from '@suite-native/qr-code';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

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
    const { translate } = useTranslate();
    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);

    const { networkType } = networks[networkSymbol];

    const getCardAlertProps = () => {
        if (isReceiveApproved && !isPortfolioTracker) {
            return {
                alertTitle: translate('moduleReceive.receiveAddressCard.alert.success'),
                alertVariant: 'success',
            } as const;
        }
        if (networkSymbol === 'ada' && isUnverifiedAddressRevealed) {
            return {
                alertTitle: translate('moduleReceive.receiveAddressCard.alert.longCardanoAddress'),
                alertVariant: 'info',
            } as const;
        }
        if (isEthereumTokenAddress) {
            return {
                alertTitle: translate('moduleReceive.receiveAddressCard.alert.ethereumToken'),
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
