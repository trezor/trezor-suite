import React from 'react';
import { Linking } from 'react-native';

import { S } from '@mobily/ts-belt';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Box, IconButton, Divider, ListItem } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { getAppVersion, getBuildVersionNumber, getCommitHash } from '@suite-native/config';

import { AboutUsBanners } from '../components/AboutUsBanners';

export const SettingsAboutUsScreen = () => {
    const hasVerionAndBuildInfo =
        S.isNotEmpty(getAppVersion()) && S.isNotEmpty(getBuildVersionNumber());
    const hasCommitHash = S.isNotEmpty(getCommitHash());

    return (
        <Screen header={<ScreenHeader title="About Trezor Go" />}>
            <VStack spacing="small">
                <AboutUsBanners />
                <Divider />
                <VStack>
                    <Text variant="titleSmall">Legal</Text>
                    <Card>
                        <VStack spacing="medium">
                            <ListItem title="Terms & conditions" iconName="pdf" />
                            <ListItem title="Privacy policy" iconName="pdf" />
                        </VStack>
                    </Card>
                </VStack>
                <Box flexDirection="row" justifyContent="space-between">
                    {hasVerionAndBuildInfo && (
                        <Text variant="hint" color="gray500">
                            Version: {`${getAppVersion()} (${getBuildVersionNumber()})`}
                        </Text>
                    )}
                    {hasCommitHash && (
                        <Text variant="hint" color="gray500">
                            Commit hash: {getCommitHash()}
                        </Text>
                    )}
                </Box>
                <Box flexDirection="row" justifyContent="space-between">
                    <Text variant="hint" color="gray500">
                        Version: 1.1.1
                    </Text>
                    <Text variant="hint" color="gray500">
                        Commit hash: 123456dsgfsda
                    </Text>
                </Box>
            </VStack>
        </Screen>
    );
};
