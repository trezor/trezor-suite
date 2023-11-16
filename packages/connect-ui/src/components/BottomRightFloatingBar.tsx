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

enum View {
    AnalyticsConsent,
    Default,
}

const getView = () => {
    const showAnalyticsConsent = storage.load().tracking_enabled === undefined;

    if (showAnalyticsConsent) {
        return View.AnalyticsConsent;
    }

    return View.Default;
};

type BottomRightFloatingBarProps = {
    onAnalyticsConfirm: (enabled: boolean) => void;
};

export const BottomRightFloatingBar = ({ onAnalyticsConfirm }: BottomRightFloatingBarProps) => {
    const [view, setView] = useState(getView());

    let content;
    switch (view) {
        case View.AnalyticsConsent:
            content = (
                <AnalyticsConsentWrapper
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
