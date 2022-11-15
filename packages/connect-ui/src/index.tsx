import React, { useCallback, useEffect, useState } from 'react';

import { PostMessage, UI } from '@trezor/connect';

// views
import { Transport } from './views/Transport';
import { Passphrase } from './views/Passphrase';
import { ErrorView } from './views/Error';
import { ThemeWrapper } from './support/ThemeWrapper';
import { IntlWrapper } from './support/IntlWrapper';
import { ErrorBoundary } from './support/ErrorBoundary';
import { GlobalStyle } from './support/GlobalStyle';
import { initAnalytics } from './utils/analytics';
import { BottomRightFloatingBar } from './components/BottomRightFloatingBar';
import { ConnectUIEventProps, reactEventBus } from './utils/eventBus';

type ConnectUIProps = {
    postMessage: PostMessage;
    clearLegacyView: () => void;
};

export const ConnectUI = ({ postMessage, clearLegacyView }: ConnectUIProps) => {
    const [view, setView] = useState<ConnectUIEventProps | undefined>(undefined);

    const listener = useCallback(
        (detail?: ConnectUIEventProps) => {
            clearLegacyView();
            setView(detail);
        },
        [clearLegacyView],
    );

    useEffect(() => {
        reactEventBus.on(listener);

        return () => reactEventBus.remove(listener);
    }, [listener]);

    useEffect(() => initAnalytics(), []);

    const getComponent = () => {
        if (!view?.type) return null;

        switch (view.type) {
            case UI.TRANSPORT:
                return <Transport />;
            case UI.REQUEST_PASSPHRASE:
                return <Passphrase {...view} postMessage={postMessage} />;
            case 'error':
                return <ErrorView {...view} />;
            default:
                throw new Error(`no such view exists: ${view.type}`);
        }
    };

    return (
        <ErrorBoundary>
            <GlobalStyle />
            <ThemeWrapper>
                {/* todo: load translations from somewhere and pass them to intl */}
                <IntlWrapper>
                    {getComponent()}
                    <BottomRightFloatingBar />
                </IntlWrapper>
            </ThemeWrapper>
        </ErrorBoundary>
    );
};
