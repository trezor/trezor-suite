import { useContext } from 'react';

import { ScreenshotContext } from '../components/ScreenshotProvider';

export const useTakeScreenshot = () => {
    const { takeScreenshot } = useContext(ScreenshotContext);

    return takeScreenshot;
};
