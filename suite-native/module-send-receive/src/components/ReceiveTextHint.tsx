import React from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Button, Box, VStack, Text, Card, HStack } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
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
    const openLink = useOpenLink();

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
                        For an extra layer of security, use Trezor Suite with your Trezor hardware
                        wallet to verify the receiving address.
                    </Text>
                </VStack>
            </Card>

            <TouchableOpacity onPress={() => openLink('TODO')}>
                <HStack justifyContent="center" alignItems="center">
                    <Text variant="hint" color="textPrimaryDefault" align="center">
                        Learn more about verifying addresses{' '}
                    </Text>
                    <Icon color="iconPrimaryDefault" name="arrowUpRight" size="medium" />
                </HStack>
            </TouchableOpacity>

            <Box paddingHorizontal="medium">
                <Button iconLeft="eye" size="large" onPress={onShowAddress}>
                    Show address
                </Button>
            </Box>
        </VStack>
    );
};
