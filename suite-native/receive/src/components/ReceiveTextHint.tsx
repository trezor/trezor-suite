import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Button, Box, VStack, Text, Card, HStack, Pictogram } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { Icon } from '@suite-common/icons';

type ReceiveTextHintProps = {
    onShowAddress(): void;
};

export const ReceiveTextHint = ({ onShowAddress }: ReceiveTextHintProps) => {
    const openLink = useOpenLink();

    return (
        <VStack spacing="medium">
            <Card>
                <Box marginVertical="medium">
                    <Pictogram
                        variant="yellow"
                        icon="warningTriangleLight"
                        title={
                            <VStack alignItems="center">
                                <Text variant="titleSmall" color="textSecondaryHighlight">
                                    Trezor Suite{' '}
                                    <Text variant="titleSmall" color="textSubdued">
                                        Lite{' '}
                                    </Text>
                                </Text>
                                <Text variant="titleSmall">receive address</Text>
                            </VStack>
                        }
                        subtitle="For an extra layer of security, use Trezor Suite with your Trezor hardware
                    wallet to verify the receive address."
                    />
                </Box>
            </Card>

            {/*  TODO : Replace with a TextButton atom component when ready.
                 issue: https://github.com/trezor/trezor-suite/issues/9084 */}
            <TouchableOpacity
                onPress={() =>
                    openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses')
                }
            >
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
