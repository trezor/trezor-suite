import { ReactNode } from 'react';
import styled from 'styled-components';
import { DataAnalytics } from '@trezor/components';
import { analytics } from '@trezor/suite-analytics';
import { DOCS_ANALYTICS_URL, DATA_TOS_URL } from '@trezor/urls';
import { selectIsAnalyticsConfirmed } from '@suite-common/analytics';
import { rerun } from 'src/actions/recovery/recoveryActions';
import { PrerequisitesGuide, TrezorLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/reducers/suite/suiteReducer';
import { SecurityCheck } from '../onboarding/steps/SecurityCheck/SecurityCheck';
import { typography } from '@trezor/theme';

const StyledTrezorLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    ${typography.hint}
`;

export const StartContent = () => {
    const confirmed = useSelector(selectIsAnalyticsConfirmed);
    const recovery = useSelector(state => state.recovery);
    const prerequisite = useSelector(selectPrerequisite);

    const dispatch = useDispatch();

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
        if (recovery.status === 'in-progress') {
            // T2T1 remember the recovery state and should continue with recovery
            dispatch(rerun());
        }
    };

    if (!confirmed) {
        return (
            <DataAnalytics
                onConfirm={onConfirm}
                analyticsLink={(chunks: ReactNode[]) => (
                    <StyledTrezorLink variant="underline" href={DOCS_ANALYTICS_URL}>
                        {chunks}
                    </StyledTrezorLink>
                )}
                tosLink={(chunks: ReactNode[]) => (
                    <StyledTrezorLink variant="underline" href={DATA_TOS_URL}>
                        {chunks}
                    </StyledTrezorLink>
                )}
            />
        );
    }

    if (
        prerequisite &&
        !['device-initialize', 'firmware-missing', 'device-recovery-mode'].includes(prerequisite)
    ) {
        return <PrerequisitesGuide />;
    }

    return <SecurityCheck />;
};
