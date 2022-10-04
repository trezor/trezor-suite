import React, { useState } from 'react';

import styled from 'styled-components';

import { storage } from '@trezor/connect-common';

import { AnalyticsConsentWrapper } from './AnalyticsConsentWrapper';
import { FloatingMenu } from './FloatingMenu';

const Wrapper = styled.div`
    position: absolute;
    bottom: 16px;
    right: 16px;
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

export const BottomRightFloatingBar = () => {
    const [view, setView] = useState(getView());

    let content;
    switch (view) {
        case View.AnalyticsConsent:
            content = <AnalyticsConsentWrapper onAnalyticsConfirm={() => setView(View.Default)} />;
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
