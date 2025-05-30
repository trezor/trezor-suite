import { useEffect, useRef, useState } from 'react';

export const RECENT_DURATION = 100;

export const useMountedRecentlyFlag = (context: string = '') => {
    const [isMountedRecently, setIsMountedRecently] = useState(true);
    const prevContext = useRef<string>();

    if (prevContext.current !== context) {
        prevContext.current = context;
        setIsMountedRecently(true);
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMountedRecently(false);
        }, RECENT_DURATION);

        return () => clearTimeout(timer);
    }, [context]);

    return isMountedRecently;
};
