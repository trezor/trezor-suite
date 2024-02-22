import { useState } from 'react';

import styled from 'styled-components';

import { storage } from '@trezor/connect-common';

import { AnalyticsConsentWrapper } from './AnalyticsConsentWrapper';
import { FloatingMenu } from './FloatingMenu';

const Wrapper = styled.div`
    position: absolute;
    bottom: 16px;
    right: 16px;
    z-index: 1;
`;

const View = {
    AnalyticsConsent: 'AnalyticsConsent',
    Default: 'Default',
} as const;

const getView = (showAnalyticsConsent: boolean) => {
    if (showAnalyticsConsent) {
        return View.AnalyticsConsent;
    }

    return View.Default;
};

type BottomRightFloatingBarProps = {
    onAnalyticsConfirm: (enabled: boolean) => void;
};

export const BottomRightFloatingBar = ({ onAnalyticsConfirm }: BottomRightFloatingBarProps) => {
    const initialStorage = storage.load();
    const [view, setView] = useState(getView(initialStorage.tracking_enabled === undefined));
    const isInitialTrackingEnabled = initialStorage.tracking_enabled !== false;

    let content;
    switch (view) {
        case View.AnalyticsConsent:
            content = (
                <AnalyticsConsentWrapper
                    isInitialTrackingEnabled={isInitialTrackingEnabled}
                    onAnalyticsConfirm={(enabled: boolean) => {
                        setView(View.Default);
                        onAnalyticsConfirm(enabled);
                    }}
                />
            );
            break;
        case View.Default:
        default:
            content = (
                <FloatingMenu onShowAnalyticsConsent={() => setView(View.AnalyticsConsent)} />
            );
            break;
    }

    return <Wrapper>{content}</Wrapper>;
};
