import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Box, IconButton, Link } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { getAppVersion, getBuildVersionNumber, getCommitHash } from '@suite-native/config';

export const SettingsAboutUsScreen = () => {
    const hasVerionAndBuildInfo = getAppVersion() !== '' && getBuildVersionNumber() !== '';
    const hasCommitHash = getCommitHash() !== '';

    return (
        <Screen header={<ScreenHeader title="About us" />}>
            <VStack spacing="xxl">
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
                            Trezor Suite Lite is a safe and secure way to stay connected to the
                            crypto on your hardware wallet. Track coin balances on the go without
                            exposing your private data. Easily create and send payment addresses to
                            anyone.
                        </Text>
                    </VStack>
                </Card>
                <Card>
                    <Text variant="titleMedium">Follow us</Text>
                    <Box flexDirection="row" justifyContent="space-around">
                        <Link href="https://www.facebook.com/trezor.io">
                            <IconButton colorScheme="tertiary" iconName="facebook" />
                        </Link>
                        <Link href="https://twitter.com/Trezor">
                            <IconButton colorScheme="tertiary" iconName="twitter" />
                        </Link>
                        <Link href="https://github.com/orgs/trezor/projects/61/views/7">
                            <IconButton colorScheme="tertiary" iconName="github" />
                        </Link>
                    </Box>
                </Card>
                <Box flexDirection="row" justifyContent="space-between">
                    {hasVerionAndBuildInfo && (
                        <Text>Version: {`${getAppVersion()} (${getBuildVersionNumber()})`}</Text>
                    )}
                    {hasCommitHash && <Text>Commit hash: {getCommitHash()}</Text>}
                </Box>
            </VStack>
        </Screen>
    );
};
