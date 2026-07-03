import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { SUITE_REFERRAL } from '@trezor/urls';

export const ReferralButton = () => {
    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    const openLink = useOpenLink();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const handleOpenLink = () => {
        analytics.report({
            type: events.referralButtonPressEvent.name,
        });
        openLink(SUITE_REFERRAL);
    };

    if (isPortfolioTracker) return null;

    return (
        <Button onPress={handleOpenLink} intent="neutral" priority="secondary" iconLeft="users">
            <Translation id="moduleHome.buttons.referral" />
        </Button>
    );
};
