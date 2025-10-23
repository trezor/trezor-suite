import styled from 'styled-components';

import { DataAnalytics, animations } from '@trezor/components';
import { analytics } from '@trezor/connect-analytics';

const Wrapper = styled.div`
    animation: ${animations.FADE_IN} 0.15s ease-in-out;
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
            <DataAnalytics
                isInitialTrackingEnabled={isInitialTrackingEnabled}
                onConfirm={onConfirm}
            />
        </Wrapper>
    );
};
