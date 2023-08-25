import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Divider } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsSectionItem } from '../components/SettingsSectionItem';
import { AppVersion } from '../components/AppVersion';

export const SettingsAboutUsScreen = () => {
    const openLink = useOpenLink();

    const handleOpenTermsAndConditions = () => {
        openLink('https://data.trezor.io/legal/mobile-wallet-terms.pdf');
    };

    const handleOpenPrivacyPolicy = () => {
        openLink('https://data.trezor.io/legal/privacy-policy.html');
    };

    return (
        <Screen header={<ScreenHeader content="About Trezor Suite Lite" />}>
            <VStack spacing="large">
                <AboutUsBanners />
                <Divider marginVertical="medium" />
                <SettingsSection title="Legal">
                    <SettingsSectionItem
                        title="Terms & conditions"
                        iconName="pdf"
                        onPress={handleOpenTermsAndConditions}
                    />
                    <SettingsSectionItem
                        title="Privacy policy"
                        iconName="pdf"
                        onPress={handleOpenPrivacyPolicy}
                    />
                </SettingsSection>
                <AppVersion />
            </VStack>
        </Screen>
    );
};
