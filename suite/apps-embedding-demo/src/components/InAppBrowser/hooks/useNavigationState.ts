import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';

import { type InAppBrowserHostEvent } from '@suite/desktop-app-api';

export type InAppBrowserNavigationState = Omit<
    Extract<InAppBrowserHostEvent, { type: 'navigation-state' }>,
    'type'
>;

export function useNavigationState(targetUrl: string) {
    const [navigationState, setNavigationState] = useState<InAppBrowserNavigationState>(() => ({
        url: targetUrl,
        canGoBack: false,
        canGoForward: false,
    }));

    const resetNavigationState = useCallback((url: string) => {
        setNavigationState({ url, canGoBack: false, canGoForward: false });
    }, []);

    return { navigationState, resetNavigationState, setNavigationState };
}

export type SetNavigationState = Dispatch<SetStateAction<InAppBrowserNavigationState>>;
