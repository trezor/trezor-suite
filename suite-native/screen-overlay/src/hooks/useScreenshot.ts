import { useContext } from 'react';

import { ScreenshotContext } from '../components/ScreenshotProvider';

export const useScreenshot = () => {
    const { screenshot } = useContext(ScreenshotContext);

    return screenshot;
};
