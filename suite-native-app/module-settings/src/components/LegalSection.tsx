import { CompactCardWithIconLayout, TitledSection } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { DATA_PRIVACY_URL, DATA_TOS_MOBILE_URL } from '@trezor/urls';

export const LegalSection = () => {
    const openLink = useOpenLink();

    const openTermsAndConditions = () => {
        openLink(DATA_TOS_MOBILE_URL);
    };

    const openPrivacyPolicy = () => {
        openLink(DATA_PRIVACY_URL);
    };

    return (
        <TitledSection title={<Translation id="moduleSettings.faq.legal.label" />}>
            <CompactCardWithIconLayout
                title={<Translation id="moduleSettings.faq.legal.termsAndConditions" />}
                icon="filePdf"
                onPress={openTermsAndConditions}
            />
            <CompactCardWithIconLayout
                title={<Translation id="moduleSettings.faq.legal.privacyPolicy" />}
                icon="filePdf"
                onPress={openPrivacyPolicy}
            />
        </TitledSection>
    );
};
