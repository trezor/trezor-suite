import { useServices } from '@suite-common/dependency-injection';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { SUITE_REFERRAL } from '@trezor/urls';

export const ReferralButton = () => {
    const openLink = useOpenLink();
    const { analytics } = useServices<NativeAnalyticsDep>();
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
