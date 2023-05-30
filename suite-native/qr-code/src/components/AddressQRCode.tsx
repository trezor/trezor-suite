import React from 'react';
import { Alert, Share } from 'react-native';

import { pipe, S, A } from '@mobily/ts-belt';

import { Box, Text, Button, ButtonBackgroundElevation, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { QRCode } from './QRCode';
import { QRCodeCopyButton } from './QRCodeCopyButton';

type AddressQRCodeProps = {
    address: string;
    backgroundElevation?: ButtonBackgroundElevation;
};

const ON_COPY_MESSAGE = 'Address copied';

const actionButtonsStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
}));

const splitStringByFourCharacters = (address: string) =>
    pipe(address, S.splitByRe(/(.{4})/g), A.join(' '));

export const AddressQRCode = ({ address, backgroundElevation = '0' }: AddressQRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    const handleShareData = async () => {
        try {
            await Share.share({
                message: address,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    const formattedAddress = splitStringByFourCharacters(address);

    return (
        <>
            <QRCode data={address} />
            <Box margin="small" alignItems="center" justifyContent="center">
                <Text variant="titleSmall" align="center">
                    {formattedAddress}
                </Text>
            </Box>
            <VStack spacing="small">
                <Button
                    iconRight="share"
                    size="large"
                    colorScheme={`tertiaryElevation${backgroundElevation}`}
                    onPress={handleShareData}
                    style={applyStyle(actionButtonsStyle)}
                >
                    Share
                </Button>
                <QRCodeCopyButton data={address} onCopyMessage={ON_COPY_MESSAGE} />
            </VStack>
        </>
    );
};
