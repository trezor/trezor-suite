import { type RefObject, useEffect } from 'react';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';

export function useResizeWebContentsView(slotRef: RefObject<HTMLElement | null>) {
    const { desktopApi } = useServices(injectDesktopApi);

    useEffect(() => {
        const element = slotRef.current;

        if (!element || !desktopApi.available) {
            return;
        }

        const resizeObserver = new ResizeObserver(() => {
            // Reading the rect inside the observer callback is cheap: it runs after layout, so nothing is invalidated.
            const { x, y, width, height } = element.getBoundingClientRect();

            desktopApi.inAppBrowserSetBounds({ x, y, width, height });
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();
        };
    }, [slotRef, desktopApi]);
}
