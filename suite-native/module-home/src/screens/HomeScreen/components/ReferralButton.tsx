import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useAnalytics } from '@suite-native/services';
import { SUITE_REFERRAL } from '@trezor/urls';

export const ReferralButton = () => {
    const openLink = useOpenLink();
    const analytics = useAnalytics();
    const handleOpenLink = () => {
        analytics.report({
            type: events.referralButtonPressEvent.name,
        });
        openLink(SUITE_REFERRAL);
    };

    return (
        <Button onPress={handleOpenLink} intent="neutral" priority="secondary" iconLeft="users">
            <Translation id="moduleHome.buttons.referral" />
        </Button>
    );
};
