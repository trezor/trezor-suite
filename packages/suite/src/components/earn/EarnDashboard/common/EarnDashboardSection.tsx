import { ReactNode, Ref } from 'react';

import { Translation, TranslationKey } from '@suite/intl';
import { Badge, BadgeIntent } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

import { PoweredByBadge } from '../../providers/PoweredByBadge';
import { EarnProviderId } from '../../providers/providerMetadata';

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
