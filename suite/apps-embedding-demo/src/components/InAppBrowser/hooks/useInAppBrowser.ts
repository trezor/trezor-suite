import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type InAppBrowserOpenPayload, injectDesktopApi } from '@suite/desktop-app-api';
import { selectLanguage } from '@suite/settings';
import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { useMutation } from '@suite-common/react-query';
import { useServices } from '@trezor/dependency-injection';

import { useInAppBrowserEvents } from './useInAppBrowserEvents';
import { useNavigationState } from './useNavigationState';
import { LOCAL_IPC_MUTATION_OPTIONS } from '../constants';

type UseAppsEmbeddingDesktopParams = {
    /**
     * What the bar shows until the host reports a navigation, and — only for demo purposes — the
     * page a custom url opens. For a catalog entry the host resolves the page itself.
     */
    targetUrl: string;
    /**
     * Catalog entry being embedded, absent for a custom url. The host looks the entry up in the
     * catalog and reads everything about it from there — its page, where it may navigate, what
     * it may open in a window of its own and whether it keeps its data between restarts — never
     * from here.
     */
    entryId?: string;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

/**
 * Drives the main-process WebContentsView host:
 * - opens the target for the lifetime of the calling component
 * - translates the host events into the shared cross-platform event shape
 * - tracks the view's navigation state for the browser bar
 */
export const useInAppBrowser = ({ targetUrl, entryId, onEvent }: UseAppsEmbeddingDesktopParams) => {
    // An entry whose page depends on the language is resolved by the host, which has no language
    // of its own.
    const locale = useSelector(selectLanguage);
    const { navigationState, setNavigationState } = useNavigationState(targetUrl);

    const attachHostEventHandler = useInAppBrowserEvents({
        onEvent,
        onNavigationState: setNavigationState,
    });

    const { desktopApi } = useServices(injectDesktopApi);
    const { mutate: openInAppBrowserView } = useMutation({
        mutationFn: desktopApi.inAppBrowserOpenView,
        ...LOCAL_IPC_MUTATION_OPTIONS,
    });
    const { mutate: closeInAppBrowserView } = useMutation({
        mutationFn: desktopApi.inAppBrowserCloseView,
        ...LOCAL_IPC_MUTATION_OPTIONS,
    });

    useEffect(() => {
        setNavigationState({ url: targetUrl, canGoBack: false, canGoForward: false });

        const removeHostEventHandler = attachHostEventHandler();

        const payload: InAppBrowserOpenPayload =
            entryId === undefined
                ? { kind: 'custom-url', url: targetUrl }
                : { kind: 'catalog-entry', entryId, locale };

        openInAppBrowserView(payload);

        return () => {
            removeHostEventHandler();
            closeInAppBrowserView();
        };
    }, [
        targetUrl,
        entryId,
        locale,
        attachHostEventHandler,
        desktopApi,
        openInAppBrowserView,
        closeInAppBrowserView,
        setNavigationState,
    ]);

    return {
        navigationState,
    };
};
