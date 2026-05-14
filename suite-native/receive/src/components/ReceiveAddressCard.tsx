import Animated, { Layout } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectIsDeviceInViewOnlyMode, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { Box, Card, type InlineAlertBoxProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { AddressQRCode } from '@suite-native/qr-code';
import type { StaticSessionId } from '@trezor/connect';

import { UnverifiedAddress } from './UnverifiedAddress';

type ReceiveAddressCardProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    isReceiveApproved: boolean;
    accountDescriptor: AccountDescriptor;
    isUnverifiedAddressRevealed: boolean;
    symbol: NetworkSymbol;
    onShowAddress: () => void;
    isTokenAddress?: boolean;
    isLoading?: boolean;
};

export const ReceiveAddressCard = ({
    accountDescriptor,
    address,
    deviceStaticSessionId,
    isUnverifiedAddressRevealed,
    isReceiveApproved,
    onShowAddress,
    symbol,
    isLoading,
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
                        <AddressQRCode
                            accountDescriptor={accountDescriptor}
                            address={address}
                            deviceStaticSessionId={deviceStaticSessionId}
                            networkSymbol={symbol}
                            showLabelEdit={!isTokenAddress}
                        />
                    ) : (
                        <UnverifiedAddress
                            address={address}
                            isLoading={isLoading}
                            isAddressRevealed={isUnverifiedAddressRevealed && !isLoading}
                            isCardanoAddress={networkType === 'cardano'}
                            onShowAddress={onShowAddress}
                        />
                    )}
                </Box>
            </Card>
        </Animated.View>
    );
};
