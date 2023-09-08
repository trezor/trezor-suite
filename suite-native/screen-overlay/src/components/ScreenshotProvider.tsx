import React, { createContext, MutableRefObject, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { makeImageFromView, SkImage } from '@shopify/react-native-skia';

const SNAPSHOT_TIMEOUT = 1000;

export const ScreenshotContext = createContext<{
    screenshot: SkImage | null;
    takeScreenshot: (screenViewRef: MutableRefObject<View | null>) => void;
}>({ screenshot: null, takeScreenshot: () => {} });

export const ScreenshotProvider = ({ children }: { children: React.ReactNode }) => {
    const [screenshot, setScreenshot] = useState<SkImage | null>(null);

    const takeScreenshot = useCallback((screenViewRef: MutableRefObject<View | null>) => {
        if (!screenViewRef) return;

        // The timeout is needed because sometimes happens that the target view of the snapshot is already defined
        // but the UI is not rendered yet. If you try to take snapshot in such situation, the Skia crashes the app.
        // see more: https://github.com/Shopify/react-native-skia/discussions/1648
        setTimeout(async () => {
            const freshSnapshot = await makeImageFromView(screenViewRef);
            setScreenshot(freshSnapshot);
        }, SNAPSHOT_TIMEOUT);
    }, []);

    const contextValue = useMemo(
        () => ({
            screenshot,
            takeScreenshot,
        }),
        [screenshot, takeScreenshot],
    );

    return <ScreenshotContext.Provider value={contextValue}>{children}</ScreenshotContext.Provider>;
};
