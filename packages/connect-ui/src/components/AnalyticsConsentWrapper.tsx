import styled from 'styled-components';

import { analytics } from '@trezor/connect-analytics';
import { animations, DataAnalytics } from '@trezor/components';

const Wrapper = styled.div`
    animation: ${animations.FADE_IN} 0.15s ease-in-out;
`;

const StyledDataAnalytics = styled(DataAnalytics)`
    box-shadow: 0 0 6px 1px #e3e3e3;
`;

type AnalyticsConsentWrapperProps = {
    onAnalyticsConfirm: (enabled: boolean) => void;
};

export const AnalyticsConsentWrapper = ({ onAnalyticsConfirm }: AnalyticsConsentWrapperProps) => {
    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }

        onAnalyticsConfirm(trackingEnabled);
    };

    return (
        <Wrapper>
            <StyledDataAnalytics onConfirm={onConfirm} />
        </Wrapper>
    );
};
