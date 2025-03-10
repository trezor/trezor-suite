import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';

import { CoreRequestMessage, POPUP, UI, UI_REQUEST } from '@trezor/connect';
import { OriginBoundState, storage } from '@trezor/connect-common';
import { isNewerOrEqual } from '@trezor/utils/src/versionUtils';

// views

import { BottomRightFloatingBar } from './components/BottomRightFloatingBar';
import { InfoPanel } from './components/InfoPanel';
import { Loader } from './components/Loader';
import {
    BackupNotification,
    BridgeUpdateNotification,
    FirmwareUpdateNotification,
    SuspiciousOriginNotification,
} from './components/Notification';
import { ErrorBoundary } from './support/ErrorBoundary';
import { GlobalStyle } from './support/GlobalStyle';
import { IntlWrapper } from './support/IntlWrapper';
import { ThemeWrapper } from './support/ThemeWrapper';
import { State, getDefaultState } from './types';
import { initAnalytics } from './utils/analytics';
import { ConnectUIEventProps, reactEventBus } from './utils/eventBus';
import { ErrorView } from './views/Error';
import { Passphrase } from './views/Passphrase';
import { Transport } from './views/Transport';

export type { State } from './types';
export { getDefaultState } from './types';

const Layout = styled.div`
    display: flex;
    flex: 1;

    @media (max-width: 639px) {
        flex-direction: column;
    }
`;

type ConnectUIProps = {
    postMessage: (message: CoreRequestMessage) => void;
    clearLegacyView: () => void;
};

export const ConnectUI = ({ postMessage, clearLegacyView }: ConnectUIProps) => {
    // we simply store all UI relevant messages here and use them to derive what should we render
    const [messages, setMessages] = useState<(ConnectUIEventProps | null)[]>([]);
    // flowInfo is the only exception to the rule outlined above
    const [state, setState] = useState<State>(getDefaultState());

    const listener = useCallback((message: ConnectUIEventProps | null) => {
        // set state
        if (message?.type === 'state-update') {
            setState(message.payload);

            // do not add state-update messages to the list of messages
            // it would mean Component gets set to null
            return;
        }

        // set current view
        setMessages(prevMessages => [message, ...prevMessages]);
    }, []);

    useEffect(() => {
        reactEventBus.on(listener);

        return () => reactEventBus.remove(listener);
    }, [listener]);

    useEffect(() => {
        reactEventBus.dispatch({ type: 'connect-ui-rendered' });
        initAnalytics();

        // subscribe to changes
        storage.on('changed', storageNextState => {
            setState(prevState => ({ ...prevState, ...storageNextState }));
        });
    }, []);

    useEffect(() => {
        if (!state?.settings?.origin) return;

        const data = storage.loadForOrigin(state.settings.origin);

        const getNextState = (prevState: State, originBoundState: OriginBoundState) => ({
            ...prevState,
            ...originBoundState,
        });

        // load initial data
        setState(prevState => getNextState(prevState, data));

        return () => {
            storage.removeAllListeners();
        };
    }, [state?.settings?.origin]);

    const outdated = state?.transports?.find(t => t.type === 'BridgeTransport')?.outdated;

    const [Component, Notifications] = useMemo(() => {
        let component: ReactNode | null;

        // component (main screen)

        if (!messages.length) {
            component = <Loader />;
        } else {
            // messages[0] could be null. in that case, legacy view is rendered
            switch (messages[0]?.type) {
                case 'loading':
                    component = <Loader message={messages[0]?.message} />;
                    break;
                case UI.TRANSPORT:
                    component = <Transport />;
                    break;
                case UI.REQUEST_PASSPHRASE:
                    component = <Passphrase {...messages[0]} postMessage={postMessage} />;
                    break;
                case 'error':
                    component = <ErrorView {...messages[0]} />;
                    break;
                default:
            }
        }

        // notifications
        const notifications: { [key: string]: JSX.Element } = {};
        if (outdated) {
            notifications['bridge-outdated'] = <BridgeUpdateNotification key="bridge-outdated" />;
        }
        messages.forEach(message => {
            if (message?.type === UI_REQUEST.FIRMWARE_OUTDATED) {
                notifications[message.type] = <FirmwareUpdateNotification key={message.type} />;
            } else if (message?.type === UI_REQUEST.DEVICE_NEEDS_BACKUP) {
                notifications[message.type] = <BackupNotification key={message.type} />;
            } else if (message?.type === 'phishing-domain') {
                notifications[message.type] = <SuspiciousOriginNotification key={message.type} />;
            }

            return notifications;
        });

        return [component, notifications];
    }, [messages, postMessage, outdated]);

    useEffect(() => {
        if (Component) {
            clearLegacyView();
        }
    }, [Component, clearLegacyView]);

    return (
        <ErrorBoundary>
            <GlobalStyle />
            <ThemeWrapper>
                {/* todo: load translations from somewhere and pass them to intl */}
                <IntlWrapper>
                    <Layout>
                        <InfoPanel
                            method={state?.info}
                            origin={state?.settings?.origin}
                            hostLabel={state?.settings?.hostLabel}
                            topSlot={Object.values(Notifications)}
                            showNpmPackageOutdated={
                                state?.settings?.env === 'web' &&
                                // npmVersion missing - pinned iframe version or core-in-popup. we might extend this warning in the future for other cases
                                !!state?.settings?.npmVersion &&
                                !isNewerOrEqual(state.settings.npmVersion, '9.4.0')
                            }
                        />

                        {Component && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flex: 1,
                                }}
                            >
                                {Component}
                            </div>
                        )}
                        <BottomRightFloatingBar
                            onAnalyticsConfirm={enabled => {
                                postMessage({
                                    type: POPUP.ANALYTICS_RESPONSE,
                                    payload: { enabled },
                                });
                            }}
                        />
                    </Layout>
                </IntlWrapper>
            </ThemeWrapper>
        </ErrorBoundary>
    );
};
