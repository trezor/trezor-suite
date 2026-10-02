import { useCallback } from 'react';

import { type InAppBrowserHostEvent, injectDesktopApi } from '@suite/desktop-app-api';
import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { useServices } from '@suite-common/dependency-injection';
import { useFreshRef } from '@trezor/react-utils';
import { exhaustive } from '@trezor/type-utils';

import { type SetNavigationState } from './useNavigationState';

export type UseHostEventParams = {
    onEvent: (event: AppsEmbeddingEvent) => void;
    onNavigationState: SetNavigationState;
};

export function useInAppBrowserEvents({ onEvent, onNavigationState }: UseHostEventParams) {
    const { desktopApi } = useServices(injectDesktopApi);
    const onEventRef = useFreshRef(onEvent);
    const onNavigationStateRef = useFreshRef(onNavigationState);

    return useCallback(() => {
        const handleHostEvent = (event: InAppBrowserHostEvent) => {
            switch (event.type) {
                case 'navigated':
                    onEventRef.current({ type: 'navigated', url: event.url });
                    break;
                case 'navigation-state':
                    onNavigationStateRef.current({
                        url: event.url,
                        canGoBack: event.canGoBack,
                        canGoForward: event.canGoForward,
                    });
                    break;
                case 'loaded':
                    onEventRef.current({ type: 'loaded', detail: event.url });
                    break;
                case 'load-failed':
                    onEventRef.current({
                        type: 'load-failed',
                        detail: `${event.url}: ${event.error}`,
                    });
                    break;
                case 'window-open-attempt':
                    onEventRef.current({
                        type: 'window-open-attempt',
                        url: event.url,
                        outcome: event.outcome,
                    });
                    break;
                case 'navigation-blocked':
                    onEventRef.current({ type: 'navigation-blocked', url: event.url });
                    break;
                default:
                    exhaustive(event);
            }
        };

        desktopApi.on('in-app-browser/event', handleHostEvent);

        function unsubscribe() {
            desktopApi.removeAllListeners('in-app-browser/event');
        }

        return unsubscribe;
    }, [onEventRef, onNavigationStateRef, desktopApi]);
}
