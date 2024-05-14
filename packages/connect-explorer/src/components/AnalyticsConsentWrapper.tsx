import styled from 'styled-components';

import { analytics } from '../analytics';
import { animations, colors, DataAnalytics, Icon } from '@trezor/components';
import { useState } from 'react';

const Wrapper = styled.div`
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 100;
    animation: ${animations.FADE_IN} 0.15s ease-in-out;
`;

const StyledDataAnalytics = styled(DataAnalytics)`
    box-shadow: 0 0 6px 1px #e3e3e3;
`;

const IconWrapper = styled.div`
    width: 40px;
    height: 40px;
    background-color: #c4c4c44d;
    border-radius: 25px;
    justify-content: center;
    align-items: center;
    display: flex;
    cursor: pointer;
    box-shadow: 0 1px 5px 0 rgb(0 0 0 / 10%);
    transition: background-color 0.3s;
    animation: ${animations.FADE_IN} 0.15s ease-in-out;

    &:hover {
        background-color: #c4c4c480;
    }
`;

export const AnalyticsConsentWrapper = () => {
    const [showAnalyticsConsent, setShowAnalyticsConsent] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
        setAnalyticsEnabled(trackingEnabled);
        setShowAnalyticsConsent(false);
    };

    return (
        <Wrapper>
            {showAnalyticsConsent ? (
                <StyledDataAnalytics
                    isInitialTrackingEnabled={analyticsEnabled}
                    onConfirm={onConfirm}
                />
            ) : (
                <IconWrapper
                    onClick={() => setShowAnalyticsConsent(true)}
                    data-test="@analytics/settings"
                >
                    <Icon icon="SETTINGS" size={22} color={colors.TYPE_DARK_GREY} />
                </IconWrapper>
            )}
        </Wrapper>
    );
};
