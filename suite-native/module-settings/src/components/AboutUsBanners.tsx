import React from 'react';
import { Linking } from 'react-native';
import Toast from 'react-native-root-toast';

import { Box, Card, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';

export const AboutUsBanners = () => {
    const handleRedirect = async (href: string) => {
        try {
            await Linking.openURL(href);
        } catch {
            Toast.show('Unable to open the link.');
        }
    };
    return (
        <>
            <Card
                style={{
                    paddingHorizontal: 24,
                    paddingVertical: 48,
                }}
            >
                <VStack
                    spacing="large"
                    style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                >
                    <Icon name="trezor" />
                    <Text>
                        Trezor Go is a safe and secure way to stay connected to the crypto on your
                        hardware wallet. Track coin balances on the go without exposing your private
                        data. Easily create and send payment addresses to anyone.
                    </Text>
                </VStack>
            </Card>
            <Card>
                <Text variant="titleMedium">Follow us</Text>
                <Box flexDirection="row" justifyContent="space-around">
                    <IconButton
                        colorScheme="tertiaryElevation1"
                        iconName="facebook"
                        onPress={() => handleRedirect('https://www.facebook.com/trezor.io')}
                    />
                    <IconButton
                        colorScheme="tertiaryElevation1"
                        iconName="twitter"
                        onPress={() => handleRedirect('https://twitter.com/Trezor')}
                    />
                    <IconButton
                        colorScheme="tertiaryElevation1"
                        iconName="github"
                        onPress={() =>
                            handleRedirect('https://github.com/orgs/trezor/projects/61/views/7')
                        }
                    />
                </Box>
            </Card>
        </>
    );
};
