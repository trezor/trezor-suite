import React from 'react';

import {
    Button,
    Box,
    VStack,
    Text,
    Pictogram,
    HeaderedCard,
    TextButton,
} from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';

type ReceiveTextHintProps = {
    onShowAddress(): void;
};

export const ReceiveTextHint = ({ onShowAddress }: ReceiveTextHintProps) => {
    const openLink = useOpenLink();

    const handleOpenLearnLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    return (
        <VStack spacing="medium">
            <Card>
                <Box marginVertical="medium">
                    <Pictogram
                        variant="yellow"
                        icon="warningCircleLight"
                        title={
                            <Text variant="titleSmall" align="center">
                                <Text
                                    variant="titleSmall"
                                    color="textSecondaryHighlight"
                                    align="center"
                                >
                                    Trezor Suite
                                </Text>{' '}
                                <Text variant="titleSmall" color="textSubdued" align="center">
                                    Lite
                                </Text>
                                {'\n'}
                                receive address
                            </Text>
                        }
                        subtitle="For an extra layer of security, use Trezor Suite with your Trezor hardware
                    wallet to verify the receive address."
                    />
                </Box>
            </Card>

            <TextButton size="small" onPress={handleOpenLearnLink} iconRight="arrowUpRight">
                Learn more about verifying addresses
            </TextButton>

            <Box paddingHorizontal="medium">
                <Button iconLeft="eye" size="large" onPress={onShowAddress}>
                    Show address
                </Button>
            </Box>
        </VStack>
    );
};
