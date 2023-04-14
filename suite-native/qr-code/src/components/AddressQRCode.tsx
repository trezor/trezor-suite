import React from 'react';
import { Alert, Share } from 'react-native';

import { Button, ButtonBackgroundElevation, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { QRCode } from './QRCode';
import { QRCodeCopyAndShareButton } from './QRCodeCopyAndShareButton';

type AddressQRCodeProps = {
    onCopy: () => void;
    data?: string;
    onCopyMessage?: string;
    isShareEnabled?: boolean;
    backgroundElevation?: ButtonBackgroundElevation;
};

const actionButtonsStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
}));

export const AddressQRCode = ({
    onCopy,
    data,
    onCopyMessage = 'Address copied',
    isShareEnabled = false,
    backgroundElevation = '0',
}: AddressQRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    if (!data) return null;

    const handleSharedata = async () => {
        try {
            await Share.share({
                message: data,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    return (
        <>
            <QRCode data={data} />
            <VStack spacing="small">
                {isShareEnabled && (
                    <Button
                        iconRight="share"
                        size="large"
                        colorScheme={`tertiaryElevation${backgroundElevation}`}
                        onPress={handleSharedata}
                        style={applyStyle(actionButtonsStyle)}
                    >
                        Share
                    </Button>
                )}
                <QRCodeCopyAndShareButton
                    data={data}
                    onCopyMessage={onCopyMessage}
                    onCopy={onCopy}
                />
            </VStack>
        </>
    );
};
