import { type ReactNode, type Ref } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';

import { DashboardSection } from 'src/components/dashboard';

import { PoweredByBadge } from '../../providers/PoweredByBadge';
import { type EarnProviderId } from '../../providers/providerMetadata';

type EarnDashboardSectionProps = {
    titleId: TranslationKey;
    subheadingId: TranslationKey;
    provider?: EarnProviderId;
    sectionRef?: Ref<HTMLDivElement>;
    children: ReactNode;
};

export const EarnDashboardSection = ({
    titleId,
    subheadingId,
    provider,
    sectionRef,
    children,
}: EarnDashboardSectionProps) => {
    const actions = provider ? <PoweredByBadge provider={provider} /> : undefined;

    return (
        <DashboardSection
            heading={<Translation id={titleId} />}
            subheading={<Translation id={subheadingId} />}
            actions={actions}
            ref={sectionRef}
        >
            {children}
        </DashboardSection>
    );
};
