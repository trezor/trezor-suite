import { useEffect } from 'react';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { useServices } from '@suite-common/dependency-injection';
import { useMutation } from '@suite-common/react-query';
import { type HttpsUrl } from '@trezor/type-utils';

import { useInAppBrowserEvents } from './useInAppBrowserEvents';
import { useNavigationState } from './useNavigationState';
import { LOCAL_IPC_MUTATION_OPTIONS } from '../constants';

const NO_EXTERNAL_ORIGINS: HttpsUrl[] = [];

type UseAppsEmbeddingDesktopParams = {
    targetUrl: string;
    /**
     * Catalog entry being embedded, absent for a custom url. The host uses it to look the entry up
     * in the catalog — whether the site keeps its data between restarts is decided there, not here.
     */
    entryId?: string;
    /**
     * Origins the site may navigate to besides its own. Must be a stable reference — changing it
     * tears the native view down and opens it again.
     */
    redirectExternalOrigins?: HttpsUrl[];
    /** Origins the site may open in a window of its own. Stable reference, as above. */
    popupExternalOrigins?: HttpsUrl[];
    onEvent: (event: AppsEmbeddingEvent) => void;
};

/**
 * Drives the main-process WebContentsView host:
 * - opens the target url for the lifetime of the calling component
 * - translates the host events into the shared cross-platform event shape
 * - tracks the view's navigation state for the browser bar
 */
export const useInAppBrowser = ({
    targetUrl,
    entryId,
    redirectExternalOrigins = NO_EXTERNAL_ORIGINS,
    popupExternalOrigins = NO_EXTERNAL_ORIGINS,
    onEvent,
}: UseAppsEmbeddingDesktopParams) => {
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

        openInAppBrowserView({
            url: targetUrl,
            redirectExternalOrigins,
            popupExternalOrigins,
            entryId,
        });

        return () => {
            removeHostEventHandler();
            closeInAppBrowserView();
        };
    }, [
        targetUrl,
        entryId,
        redirectExternalOrigins,
        popupExternalOrigins,
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
