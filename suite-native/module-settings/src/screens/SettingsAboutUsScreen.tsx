import React from 'react';

import { S } from '@mobily/ts-belt';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Card, Text, Box, Divider, ListItem } from '@suite-native/atoms';
import { getBuildVersionNumber } from '@suite-native/config';
import { getSuiteVersion, getCommitHash } from '@trezor/env-utils';
import { useOpenLink } from '@suite-native/link';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { ProductionDebug } from '../components/ProductionDebug';

const CommitHashWithDevMenu = () => (
    <ProductionDebug>
        <Text variant="hint" color="textDisabled">
            Commit hash: {getCommitHash()}
        </Text>
    </ProductionDebug>
);

export const SettingsAboutUsScreen = () => {
    const openLink = useOpenLink();
    const hasVersionAndBuildInfo =
        S.isNotEmpty(getSuiteVersion()) && S.isNotEmpty(getBuildVersionNumber());
    const hasCommitHash = S.isNotEmpty(getCommitHash());

    return (
        <Screen header={<ScreenHeader content="About Trezor Suite Lite" />}>
            <VStack spacing="small">
                <AboutUsBanners />
                <Divider marginVertical="medium" />
                <VStack spacing="medium">
                    <Text variant="titleSmall">Legal</Text>
                    <Card>
                        <VStack spacing="medium">
                            <ListItem
                                onPress={() =>
                                    openLink('https://data.trezor.io/legal/mobile-wallet-terms.pdf')
                                }
                                title="Terms & conditions"
                                iconName="pdf"
                            />
                            <ListItem
                                onPress={() =>
                                    openLink('https://data.trezor.io/legal/privacy-policy.html')
                                }
                                title="Privacy policy"
                                iconName="pdf"
                            />
                        </VStack>
                    </Card>
                </VStack>
                <Box flexDirection="row" justifyContent="space-between">
                    {hasVersionAndBuildInfo && (
                        <Text variant="hint" color="textDisabled">
                            Version: {`${getSuiteVersion()} (${getBuildVersionNumber()})`}
                        </Text>
                    )}
                    {(hasCommitHash || true) && <CommitHashWithDevMenu />}
                </Box>
            </VStack>
        </Screen>
    );
};
