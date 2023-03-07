import React from 'react';

import { S } from '@mobily/ts-belt';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Box, Divider, ListItem, handleRedirect } from '@suite-native/atoms';
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
                <Divider marginVertical="medium" />
                <VStack spacing="medium">
                    <Text variant="titleSmall">Legal</Text>
                    <Card>
                        <VStack spacing="medium">
                            <ListItem
                                onPress={() =>
                                    handleRedirect(
                                        'https://data.trezor.io/legal/mobile-wallet-terms.pdf',
                                    )
                                }
                                title="Terms & conditions"
                                iconName="pdf"
                            />
                            <ListItem
                                onPress={() =>
                                    handleRedirect(
                                        'https://trezor.io/content/wysiwyg/ToU/privacy-policy.pdf',
                                    )
                                }
                                title="Privacy policy"
                                iconName="pdf"
                            />
                        </VStack>
                    </Card>
                </VStack>
                <Box flexDirection="row" justifyContent="space-between">
                    {hasVerionAndBuildInfo && (
                        <Text variant="hint" color="textDisabled">
                            Version: {`${getAppVersion()} (${getBuildVersionNumber()})`}
                        </Text>
                    )}
                    {hasCommitHash && (
                        <Text variant="hint" color="textDisabled">
                            Commit hash: {getCommitHash()}
                        </Text>
                    )}
                </Box>
            </VStack>
        </Screen>
    );
};
