import { ReactNode } from 'react';

import { useTheme } from 'styled-components';

import { selectIsAnalyticsConfirmed } from '@suite-common/analytics';
import { DataAnalytics } from '@trezor/components';
import { analytics } from '@trezor/suite-analytics';
import { DATA_TOS_URL, DOCS_ANALYTICS_URL } from '@trezor/urls';

import { rerun } from 'src/actions/recovery/recoveryActions';
import { PrerequisitesGuide, TrezorLink } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/reducers/suite/suiteReducer';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';
import { SecurityCheck } from '../onboarding/steps/SecurityCheck/SecurityCheck';

export const StartContent = () => {
    const confirmed = useSelector(selectIsAnalyticsConfirmed);
    const recovery = useSelector(state => state.recovery);
    const prerequisite = useSelector(selectPrerequisite);

    const dispatch = useDispatch();
    const theme = useTheme();

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
                    <TrezorLink
                        color={theme.textSubdued}
                        typographyStyle="label"
                        variant="underline"
                        href={DOCS_ANALYTICS_URL}
                    >
                        {chunks}
                    </TrezorLink>
                )}
                tosLink={(chunks: ReactNode[]) => (
                    <TrezorLink
                        color={theme.textSubdued}
                        typographyStyle="label"
                        variant="underline"
                        href={DATA_TOS_URL}
                    >
                        {chunks}
                    </TrezorLink>
                )}
            />
        );
    }

    if (
        prerequisite &&
        !['device-initialize', 'firmware-missing', 'device-recovery-mode'].includes(prerequisite)
    ) {
        return (
            <>
                <ModalSwitcher />
                <PrerequisitesGuide />
            </>
        );
    }

    // Security check has to be without <ModalSwitcher /> as it handles the
    // button request without it. Its terrible, but it is what it is.
    return <SecurityCheck />;
};
