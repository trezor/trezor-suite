import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Button, Box, VStack, Text } from '@suite-native/atoms';
import { Link } from '@suite-native/link';

type ReceiveTextHintProps = {
    onShowAddress(): void;
};

const hintWrapperStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.medium,
    alignItems: 'center',
    textAlign: 'center',
}));

export const ReceiveTextHint = ({ onShowAddress }: ReceiveTextHintProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <VStack spacing="large">
            <VStack spacing="medium" style={applyStyle(hintWrapperStyle)}>
                <Text variant="titleSmall">
                    <Text variant="titleSmall" color="textSecondaryHighlight">
                        Trezor Go
                    </Text>{' '}
                    addresses
                </Text>

                <Text variant="hint" color="textAlertRed" align="center">
                    Good to know
                </Text>
                <Text variant="hint" color="textSubdued" align="center">
                    Trezor Go addresses are best suited for small transfers.
                </Text>
                <Text variant="hint" color="textSubdued" align="center">
                    For large transactions, switch to the Trezor Suite desktop app connected with
                    your Trezor device to complete the address verification process.
                </Text>

                <Box flexDirection="row" justifyContent="center">
                    <Text variant="label" color="textSubdued" align="center">
                        Learn more about addresses in Trezor Go{' '}
                    </Text>
                    <Link href="TODO">
                        <Text variant="label" color="textSecondaryHighlight" align="center">
                            here
                        </Text>
                    </Link>
                </Box>
            </VStack>
            <Button iconLeft="eye" size="large" onPress={onShowAddress}>
                Show address
            </Button>
        </VStack>
    );
};
