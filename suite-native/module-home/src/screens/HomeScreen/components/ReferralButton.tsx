import { EventType } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useLegacyAnalytics } from '@suite-native/services';
import { SUITE_REFERRAL } from '@trezor/urls';

export const ReferralButton = () => {
    const openLink = useOpenLink();
    const legacyAnalytics = useLegacyAnalytics();
    const handleOpenLink = () => {
        legacyAnalytics.report({
            type: EventType.ReferralButtonPress,
        });
        openLink(SUITE_REFERRAL);
    };

    return (
        <Button onPress={handleOpenLink} colorScheme="tertiaryElevation0" viewLeft="users">
            <Translation id="moduleHome.buttons.referral" />
        </Button>
    );
};
