import { type ReactNode, type Ref } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectRouteName } from '@suite/router';
import type { EarnProviderId } from '@suite-common/earn-api';
import { Badge, type BadgeIntent } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useSelector } from 'src/hooks/suite';

import { PoweredByBadge } from '../../providers/PoweredByBadge';

type EarnDashboardSectionProps = {
    titleId: TranslationKey;
    subheadingId: TranslationKey;
    provider?: EarnProviderId;
    statusBadge?: {
        intent: BadgeIntent;
        labelId: TranslationKey;
    };
    sectionRef?: Ref<HTMLDivElement>;
    children: ReactNode;
};

export const EarnDashboardSection = ({
    titleId,
    subheadingId,
    provider,
    statusBadge,
    sectionRef,
    children,
}: EarnDashboardSectionProps) => {
    const routeName = useSelector(selectRouteName);
    const isOnEarnPage = routeName === 'suite-earn';
    const actions = isOnEarnPage && provider ? <PoweredByBadge provider={provider} /> : undefined;

    return (
        <DashboardSection
            heading={
                <>
                    <Translation id={titleId} />
                    {statusBadge && (
                        <Badge intent={statusBadge.intent} margin={{ left: 12 }}>
                            <Translation id={statusBadge.labelId} />
                        </Badge>
                    )}
                </>
            }
            subheading={<Translation id={subheadingId} />}
            actions={actions}
            ref={sectionRef}
        >
            {children}
        </DashboardSection>
    );
};
