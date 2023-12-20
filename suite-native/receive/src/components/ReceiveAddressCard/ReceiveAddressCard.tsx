import { Alert, Share } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

import { Box, Card, HStack, Button } from '@suite-native/atoms';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { useTranslate } from '@suite-native/intl';
import { useCopyToClipboard } from '@suite-native/helpers';
import { QRCode, AddressQRCode } from '@suite-native/qr-code';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { UnverifiedAddress } from '../UnverifiedAddress/UnverifiedAddress';
import { ReceiveProgressStep } from '../../hooks/useReceiveProgressSteps';
import { useReceiveAddressCardAnimations } from './useReceiveAddressCardAnimations';

const containerStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.small,
}));

type ReceiveAddressCardProps = {
    address: string;
    networkSymbol: NetworkSymbol;
    onShowAddress: () => void;
    isEthereumTokenAddress?: boolean;
    receiveProgressStep: ReceiveProgressStep;
};

export const ReceiveAddressCard = ({
    address,
    onShowAddress,
    networkSymbol,
    isEthereumTokenAddress = false,
    receiveProgressStep,
}: ReceiveAddressCardProps) => {
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();
    const { applyStyle } = useNativeStyles();
    const {
        addressQRStyle,
        deviceScreenStyle,
        buttonsStyle,
        isShowedDeviceQRStep,
        isShowedPortfolioQRStep,
        canShowAlertBox,
    } = useReceiveAddressCardAnimations({
        receiveProgressStep,
    });

    const { networkType } = networks[networkSymbol];

    const getCardAlertProps = () => {
        if (!canShowAlertBox) {
            return {
                alertTitle: undefined,
                alertVariant: undefined,
            } as const;
        }
        if (receiveProgressStep === ReceiveProgressStep.ApprovedOnTrezor) {
            return {
                alertTitle: translate('moduleReceive.receiveAddressCard.alert.success'),
                alertVariant: 'success',
                isAlertAnimated: true,
            } as const;
        }
        if (
            networkSymbol === 'ada' &&
            receiveProgressStep === ReceiveProgressStep.ShownUncheckedAddress
        ) {
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

        return {
            alertTitle: undefined,
            alertVariant: undefined,
        } as const;
    };

    const cardAlertProps = getCardAlertProps();

    const handleCopyAddress = async () => {
        await copyToClipboard(address, translate('qrCode.addressCopied'));
    };

    const handleShareData = async () => {
        try {
            await Share.share({
                message: address,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    return (
        <Animated.View layout={Layout}>
            <Card {...cardAlertProps}>
                <Box style={applyStyle(containerStyle)}>
                    {isShowedDeviceQRStep && (
                        <Animated.View style={addressQRStyle}>
                            <QRCode data={address} />
                        </Animated.View>
                    )}
                    {isShowedPortfolioQRStep && (
                        <Animated.View>
                            <AddressQRCode address={address} />
                        </Animated.View>
                    )}
                    <Animated.View style={deviceScreenStyle}>
                        <UnverifiedAddress
                            address={address}
                            isCardanoAddress={networkType === 'cardano'}
                            onShowAddress={onShowAddress}
                            receiveProgressStep={receiveProgressStep}
                        />
                    </Animated.View>
                    <Animated.View style={buttonsStyle}>
                        <HStack spacing="small" justifyContent="center">
                            <Button
                                size="small"
                                iconLeft="copy"
                                onPress={handleCopyAddress}
                                colorScheme="tertiaryElevation1"
                            >
                                {translate('qrCode.copyButton')}
                            </Button>
                            <Button
                                size="small"
                                iconLeft="shareAlt"
                                colorScheme="tertiaryElevation1"
                                onPress={handleShareData}
                            >
                                {translate('qrCode.shareButton')}
                            </Button>
                        </HStack>
                    </Animated.View>
                </Box>
            </Card>
        </Animated.View>
    );
};
