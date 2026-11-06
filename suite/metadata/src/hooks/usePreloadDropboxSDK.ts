import { useEffect } from 'react';

import { preloadDropboxSDK } from '../providers/DropboxProvider';

export const usePreloadDropboxSDK = () => {
    useEffect(() => {
        preloadDropboxSDK();
    }, []);
};
