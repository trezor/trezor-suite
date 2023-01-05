import React from 'react';
import { analytics } from '@trezor/suite-analytics';
import { DOCS_ANALYTICS_URL, DATA_TOS_URL } from '@trezor/urls';
import { DataAnalytics } from '@trezor/components';

import { useOnboarding, useSelector } from '@suite-hooks';
import SecurityCheck from './SecurityCheck';
import TrezorLink from '@suite-components/TrezorLink';
import styled from 'styled-components';

const StyledTrezorLink = styled(TrezorLink)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const PreOnboardingSetup = () => {
    const { activeSubStep } = useOnboarding();
    const { confirmed } = useSelector(state => ({
        confirmed: state.analytics.confirmed,
    }));

    const { goToSubStep, rerun } = useOnboarding();
    const recovery = useSelector(state => state.recovery);

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
        if (recovery.status === 'in-progress') {
            // TT remember the recovery state and should continue with recovery
            rerun();
        } else {
            goToSubStep('security-check');
        }
    };

    if (activeSubStep === 'security-check' || confirmed) {
        // If user already confirmed his choice about data collection
        // and just came to setup new device or reload the page we don't won't ask to about data collection again.
        // And only show this 2nd substep
        return <SecurityCheck />;
    }

    // 1st substep
    return (
        <DataAnalytics
            onConfirm={onConfirm}
            analyticsLink={(chunks: React.ReactNode[]) => (
                <StyledTrezorLink variant="underline" href={DOCS_ANALYTICS_URL}>
                    {chunks}
                </StyledTrezorLink>
            )}
            tosLink={(chunks: React.ReactNode[]) => (
                <StyledTrezorLink variant="underline" href={DATA_TOS_URL}>
                    {chunks}
                </StyledTrezorLink>
            )}
        />
    );
};

export default PreOnboardingSetup;
