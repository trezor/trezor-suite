import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { UsersFilledIcon } from '@trezor/icons';
import { SUITE_REFERRAL } from '@trezor/urls';

import { selectIsReferralAvailable } from '../refer-a-friend/referralSelectors';

export const ReferralButton = () => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const isReferralAvailable = useSelector(selectIsReferralAvailable);
    const rememberedStandardWalletsCount = useSelector(selectRememberedStandardWalletsCount);
    const rememberedHiddenWalletsCount = useSelector(selectRememberedHiddenWalletsCount);
    const hasAtLeastOneRememberedWallet =
        rememberedStandardWalletsCount > 0 || rememberedHiddenWalletsCount > 0;

    if (isReferralAvailable) {
        return null;
    }

    return (
        <Button
            href={SUITE_REFERRAL}
            intent="neutral"
            priority="secondary"
            iconLeft={UsersFilledIcon}
            size="small"
            onClick={() => {
                analytics.report({
                    type: events.promoReferralButtonEvent.name,
                    payload: { hasAtLeastOneRememberedWallet },
                });
            }}
        >
            <Translation id="TR_DASHBOARD_REFERRAL_BUTTON" />
        </Button>
    );
};
