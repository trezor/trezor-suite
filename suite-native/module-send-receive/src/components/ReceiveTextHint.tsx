import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Button, Box, VStack, Text, Card, HStack } from '@suite-native/atoms';
import { Link } from '@suite-native/link';
import { Icon } from '@trezor/icons';

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
        <VStack spacing="medium">
            <Card>
                <VStack spacing="medium" style={applyStyle(hintWrapperStyle)}>
                    <Text variant="titleSmall" align="center">
                        <Text variant="titleSmall" color="textSecondaryHighlight" align="center">
                            Trezor Suite
                        </Text>{' '}
                        <Text variant="titleSmall" color="textSubdued" align="center">
                            Lite
                        </Text>
                        {'\n'}
                        receive address
                    </Text>

                    <Text variant="hint" color="textSubdued" align="center">
                        For an extra layer of security, use the Trezor Suite desktop app with your
                        Trezor hardware wallet to verify the receiving address.
                    </Text>
                </VStack>
            </Card>

            <Link href="TODO">
                <HStack justifyContent="center" alignItems="center">
                    <Text variant="hint" color="textPrimaryDefault" align="center">
                        Learn more about addresses in Trezor Suite Lite{' '}
                    </Text>
                    <Icon color="iconPrimaryDefault" name="arrowUpRight" size="medium" />
                </HStack>
            </Link>

            <Box paddingHorizontal="medium">
                <Button iconLeft="eye" size="large" onPress={onShowAddress}>
                    Show address
                </Button>
            </Box>
        </VStack>
    );
};
