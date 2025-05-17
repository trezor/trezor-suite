import { useEffect, useState } from 'react';

export const RECENT_DURATION = 100;

export const useMountedRecentlyFlag = () => {
    const [isMountedRecently, setIsMountedRecently] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMountedRecently(false);
        }, RECENT_DURATION);

        return () => clearTimeout(timer);
    }, []);

    return isMountedRecently;
};
