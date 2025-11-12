import type { RefObject } from 'react';

export const openDeeplinkWithWebFallback = (
    windowFocusedRef: RefObject<boolean>,
    deeplinkUrl: string,
    webUrl: string,
) => {
    // trigger deep link using iframe (to avoid beforeUnload and avoid opening new blank tab)
    const iframeDeeplink = document.createElement('iframe');
    iframeDeeplink.src = deeplinkUrl;
    iframeDeeplink.style.display = 'none';
    document.body.appendChild(iframeDeeplink);

    // fallback in case deeplink does not work
    window.setTimeout(() => {
        if (!windowFocusedRef.current) return;

        window.open(webUrl);
    }, 500);
};
