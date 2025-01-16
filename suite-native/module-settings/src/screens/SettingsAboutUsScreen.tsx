import { Screen, ScreenHeader } from '@suite-native/navigation';
import { Divider, VStack } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { useTranslate } from '@suite-native/intl';
import { SettingsSection, SettingsSectionItem } from '@suite-native/settings';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { AppVersion } from '../components/AppVersion';

export const SettingsAboutUsScreen = () => {
    const openLink = useOpenLink();

    const { translate } = useTranslate();

    const handleOpenTermsAndConditions = () => {
        openLink('https://data.trezor.io/legal/mobile-wallet-terms.pdf');
    };

    const handleOpenPrivacyPolicy = () => {
        openLink('https://data.trezor.io/legal/privacy-policy.html');
    };

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.aboutUs.title')} />}>
            <VStack spacing="sp24">
                <AboutUsBanners />
                <Divider />
                <SettingsSection title="Legal">
                    <SettingsSectionItem
                        title="Terms & conditions"
                        iconName="filePdf"
                        onPress={handleOpenTermsAndConditions}
                    />
                    <SettingsSectionItem
                        title="Privacy policy"
                        iconName="filePdf"
                        onPress={handleOpenPrivacyPolicy}
                    />
                </SettingsSection>
                <AppVersion />
            </VStack>
        </Screen>
    );
};
