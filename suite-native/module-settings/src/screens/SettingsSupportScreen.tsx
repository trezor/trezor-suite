import { CompactCardWithIconLayout, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { AppCommitHash } from '../components/AppCommitHash';
import { FAQInfoPanel } from '../components/FAQInfoPanel';
import { SettingsSection } from '../components/SettingsSection';
import { SupportCard } from '../components/SupportCard';

export const SettingsSupportScreen = () => {
    const openLink = useOpenLink();

    const handleOpenTermsAndConditions = () => {
        openLink('https://data.trezor.io/legal/mobile-wallet-terms.pdf');
    };

    const handleOpenPrivacyPolicy = () => {
        openLink('https://data.trezor.io/legal/privacy-policy.html');
    };

    return (
        <Screen
            header={<DynamicScreenHeader content={<Translation id="moduleSettings.faq.title" />} />}
        >
            <VStack spacing="sp40">
                <VStack spacing="sp32">
                    <FAQInfoPanel />
                    <SupportCard />
                </VStack>
                <AboutUsBanners />
                <SettingsSection title="Legal">
                    <CompactCardWithIconLayout
                        title="Terms & conditions"
                        icon="filePdf"
                        onPress={handleOpenTermsAndConditions}
                    />
                    <CompactCardWithIconLayout
                        title="Privacy policy"
                        icon="filePdf"
                        onPress={handleOpenPrivacyPolicy}
                    />
                </SettingsSection>
                <AppCommitHash />
            </VStack>
        </Screen>
    );
};
