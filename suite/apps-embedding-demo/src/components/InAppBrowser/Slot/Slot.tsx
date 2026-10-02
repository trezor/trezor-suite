import { useEffect, useRef } from 'react';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';

import { useResizeWebContentsView } from './hooks/useResizeWebContentsView';

type SlotProps = {
    isVisible: boolean;
};

/**
 * - Placeholder component for the native WebContentsView slot in the desktop app.
 * - It reports its bounding rectangle to the main process and controls the visibility of the embedded app.
 */
export const Slot = ({ isVisible }: SlotProps) => {
    const { desktopApi } = useServices(injectDesktopApi);
    const slotRef = useRef<HTMLDivElement>(null);

    useResizeWebContentsView(slotRef);

    useEffect(() => {
        desktopApi.inAppBrowserSetVisible(isVisible);
    }, [isVisible, desktopApi]);

    return <div ref={slotRef} style={{ flex: 1, minHeight: 0 }} />;
};
