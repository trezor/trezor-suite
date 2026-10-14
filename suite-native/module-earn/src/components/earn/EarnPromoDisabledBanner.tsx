import { BannerInline, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { type EarnType } from '../../types';

type EarnPromoDisabledBannerProps = {
    type: EarnType;
};

export const EarnPromoDisabledBanner = ({ type }: EarnPromoDisabledBannerProps) => {
    const { isDisabled, variant, content } = useMessageSystemEarnDashboard(type);

    if (!isDisabled) return null;

    return (
        <Box padding="sp16">
            <BannerInline
                intent={variant ?? 'warning'}
                title={content ?? <Translation id="earn.notAvailable" />}
            />
        </Box>
    );
};
