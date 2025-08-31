import { CompactCardWithIconLayout, TitledSection, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { DATA_PRIVACY_URL, DATA_TOS_MOBILE_URL } from '@trezor/urls';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { AppCommitHash } from '../components/AppCommitHash';
import { FAQInfoPanel } from '../components/FAQInfoPanel';
import { SupportCard } from '../components/SupportCard';

export const SettingsSupportScreen = () => {
    const openLink = useOpenLink();

    const handleOpenTermsAndConditions = () => {
        openLink(DATA_TOS_MOBILE_URL);
    };

    const handleOpenPrivacyPolicy = () => {
        openLink(DATA_PRIVACY_URL);
    };

    return (
        <Screen
            header={<DynamicScreenHeader title={<Translation id="moduleSettings.faq.title" />} />}
        >
            <VStack spacing="sp40">
                <VStack spacing="sp32">
                    <FAQInfoPanel />
                    <SupportCard />
                </VStack>
                <AboutUsBanners />
                <TitledSection title={<Translation id="moduleSettings.faq.legal" />}>
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
                </TitledSection>
                <AppCommitHash />
            </VStack>
        </Screen>
    );
};
