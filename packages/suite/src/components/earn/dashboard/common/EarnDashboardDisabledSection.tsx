import { Translation, type TranslationKey } from '@suite/intl';
import { EarnAnchor, useAnchor } from '@suite/router';
import { Banner } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import {
    type EarnDashboardType,
    useMessageSystemEarnDashboard,
} from 'src/hooks/suite/useMessageSystemEarnDashboard';

type EarnDashboardDisabledSectionProps = {
    type: EarnDashboardType;
};

const SECTION_CONFIG: Record<EarnDashboardType, { anchor: string; titleId: TranslationKey }> = {
    staking: {
        anchor: EarnAnchor.Staking,
        titleId: 'TR_EARN_STAKING_DASHBOARD_TITLE',
    },
    yield: {
        anchor: EarnAnchor.Yield,
        titleId: 'TR_EARN_STABLECOIN_YIELD_TITLE',
    },
};

export const EarnDashboardDisabledSection = ({ type }: EarnDashboardDisabledSectionProps) => {
    const { content, variant } = useMessageSystemEarnDashboard(type);
    const { anchor, titleId } = SECTION_CONFIG[type];
    const { anchorRef } = useAnchor(anchor);

    return (
        <DashboardSection heading={<Translation id={titleId} />} ref={anchorRef}>
            <Banner
                icon
                intent={variant ?? 'warning'}
                description={content ?? <Translation id="TR_EARN_NOT_AVAILABLE" />}
            />
        </DashboardSection>
    );
};
