import { Translation, type TranslationKey } from '@suite/intl';
import { EarnAnchor, isEarnYieldRowAnchor, selectRouterAnchor, useAnchor } from '@suite/router';
import { Banner } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useSelector } from 'src/hooks/suite';
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
        titleId: 'TR_EARN_DEFI_YIELD_TITLE',
    },
};

export const EarnDashboardDisabledSection = ({ type }: EarnDashboardDisabledSectionProps) => {
    const { content, variant } = useMessageSystemEarnDashboard(type);
    const { anchor, titleId } = SECTION_CONFIG[type];

    // Yield badges anchor at a single dashboard row. With the section disabled no row
    // exists, so it answers for the row anchor itself and scrolls the explanation into
    // view — without a highlight, same as the fallback in EarnYieldTable.
    const routerAnchor = useSelector(selectRouterAnchor);
    const shouldClaimRowAnchor = type === 'yield' && isEarnYieldRowAnchor(routerAnchor);
    const { anchorRef } = useAnchor(shouldClaimRowAnchor && routerAnchor ? routerAnchor : anchor);

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
