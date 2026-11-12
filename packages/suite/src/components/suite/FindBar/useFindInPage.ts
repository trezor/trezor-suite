import { useCallback, useEffect, useRef, useState } from 'react';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@trezor/dependency-injection';

export const useFindInPage = (onResult?: () => void) => {
    const { desktopApi } = useServices(injectDesktopApi);
    const [count, setCount] = useState(0);
    const [position, setPosition] = useState(0);
    const onResultRef = useRef(onResult);

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        if (!desktopApi.available) return;

        desktopApi.on('find:result', result => {
            setCount(result.matches);
            setPosition(result.activeMatchOrdinal);
            onResultRef.current?.();
        });

        return () => {
            desktopApi.findStop();
            desktopApi.removeAllListeners('find:result');
        };
    }, [desktopApi]);

    const search = useCallback(
        (nextQuery: string) => {
            if (!desktopApi.available) return;

            desktopApi.findQuery(nextQuery);
            if (nextQuery.length === 0) {
                setCount(0);
                setPosition(0);
            }
        },
        [desktopApi],
    );

    const stop = useCallback(() => {
        setCount(0);
        setPosition(0);
        if (!desktopApi.available) return;

        desktopApi.findStop();
    }, [desktopApi]);

    const next = useCallback(() => {
        if (!desktopApi.available) return;

        desktopApi.findNext();
    }, [desktopApi]);

    const prev = useCallback(() => {
        if (!desktopApi.available) return;

        desktopApi.findPrevious();
    }, [desktopApi]);

    return {
        count,
        position,
        search,
        stop,
        next,
        prev,
    };
};
