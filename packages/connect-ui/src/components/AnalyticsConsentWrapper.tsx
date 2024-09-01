import styled from 'styled-components';

import { analytics } from '@trezor/connect-analytics';
import { animations, DataAnalytics } from '@trezor/components';

const Wrapper = styled.div`
    animation: ${animations.FADE_IN} 0.15s ease-in-out;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledDataAnalytics = styled(DataAnalytics)`
    box-shadow: 0 0 6px 1px #e3e3e3;
`;

type AnalyticsConsentWrapperProps = {
    isInitialTrackingEnabled: boolean;
    onAnalyticsConfirm: (enabled: boolean) => void;
};

export const AnalyticsConsentWrapper = ({
    isInitialTrackingEnabled,
    onAnalyticsConfirm,
}: AnalyticsConsentWrapperProps) => {
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
            <StyledDataAnalytics
                isInitialTrackingEnabled={isInitialTrackingEnabled}
                onConfirm={onConfirm}
            />
        </Wrapper>
    );
};
