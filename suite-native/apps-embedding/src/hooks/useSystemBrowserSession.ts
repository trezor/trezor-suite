import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
    type WebBrowserAuthSessionResult,
    WebBrowserPresentationStyle,
    WebBrowserResultType,
    dismissAuthSession,
    dismissBrowser,
    openAuthSessionAsync,
    openBrowserAsync,
} from 'expo-web-browser';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { useMutation } from '@suite-common/react-query';
import { type HttpsUrl, exhaustive } from '@trezor/type-utils';

import { useEmbeddedAppTarget } from './useEmbeddedAppTarget';
import { type EmbeddedAppTarget } from '../types';

// An ephemeral session ends on any navigation to Suite's own scheme and hands that URL back as
// its result, so a site that finishes by redirecting to Suite needs no app switch.
const EPHEMERAL_SESSION_REDIRECT_URL = 'trezorsuite://apps-embedding';

type UseSystemBrowserSessionParams = {
    target: EmbeddedAppTarget;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

type SystemBrowserSessionParams = {
    url: HttpsUrl;
    persistSession: boolean;
};

/**
 * SFSafariViewController and Chrome Custom Tabs keep their data between openings — a store per app
 * on iOS, Chrome's own profile on Android. A session that is not to persist runs in an ephemeral
 * ASWebAuthenticationSession on iOS, the one system-browser API that promises to keep nothing.
 * Android has no equivalent, so the flag is not honoured there.
 */
const isEphemeralSession = (persistSession: boolean) => Platform.OS === 'ios' && !persistSession;

const openSystemBrowser = ({
    url,
    persistSession,
}: SystemBrowserSessionParams): Promise<WebBrowserAuthSessionResult> =>
    isEphemeralSession(persistSession)
        ? openAuthSessionAsync(url, EPHEMERAL_SESSION_REDIRECT_URL, {
              preferEphemeralSession: true,
          })
        : openBrowserAsync(url, {
              presentationStyle: WebBrowserPresentationStyle.OVER_FULL_SCREEN,
              dismissButtonStyle: 'close',
              showInRecents: true,
          });

// Only iOS can take the browser down; a Custom Tab stays until the user closes it.
const dismissSystemBrowser = (persistSession: boolean) => {
    if (Platform.OS !== 'ios') {
        return;
    }

    if (isEphemeralSession(persistSession)) {
        dismissAuthSession();

        return;
    }

    dismissBrowser().catch(_ => {
        // It rejects when no browser is open, and by then the user has most likely closed it.
    });
};

/**
 * Keeps `target` open in the system browser — SFSafariViewController / Chrome Custom Tabs, or an
 * ephemeral ASWebAuthenticationSession on iOS for a target that is not to persist — while the
 * caller is mounted. The page itself is out of reach there: only the browser opening (Android) or
 * the session ending (iOS) can be reported.
 */
export const useSystemBrowserSession = ({ target, onEvent }: UseSystemBrowserSessionParams) => {
    const resolvedTarget = useEmbeddedAppTarget({ target, onEvent });
    const url = resolvedTarget?.url;
    const persistSession = resolvedTarget?.persistSession ?? false;
    // A failure after the caller dismissed the browser is not worth a log line.
    const isDismissedRef = useRef(false);

    const { mutate: open, isPending } = useMutation({
        mutationFn: openSystemBrowser,
        onSuccess(result) {
            switch (result.type) {
                case WebBrowserResultType.CANCEL:
                case WebBrowserResultType.DISMISS:
                    onEvent({ type: 'closed', detail: `system browser ${result.type}` });
                    break;
                case WebBrowserResultType.OPENED:
                    // Android resolves right away while the browser stays in the foreground,
                    // so its closing is not observable.
                    onEvent({
                        type: 'loaded',
                        detail: 'system browser opened (content not observable)',
                    });
                    break;
                case WebBrowserResultType.LOCKED:
                    onEvent({
                        type: 'load-failed',
                        detail: 'system browser locked (another session is already open)',
                    });
                    break;
                case 'success':
                    // Only an ephemeral session ends this way: the page navigated to Suite's scheme.
                    onEvent({ type: 'navigated', url: result.url });
                    onEvent({ type: 'closed', detail: 'system browser returned to Suite' });
                    break;
                default:
                    exhaustive(result);
            }
        },
        onError(error) {
            if (!isDismissedRef.current) {
                onEvent({
                    type: 'load-failed',
                    detail: `system browser failed to open: ${error.message}`,
                });
            }
        },
    });

    useEffect(() => {
        // An unknown entry has been reported by the resolver; there is nothing to open.
        if (url === undefined) {
            return;
        }

        isDismissedRef.current = false;
        open({ url, persistSession });

        return () => {
            isDismissedRef.current = true;
            dismissSystemBrowser(persistSession);
        };
    }, [url, persistSession, open]);

    return {
        isPending,
        dismiss() {
            isDismissedRef.current = true;
            dismissSystemBrowser(persistSession);
        },
    };
};
