import { useEffect, MutableRefObject } from 'react';

export const useOnClickOutside = (
    elementRefs: MutableRefObject<HTMLElement | null>[],
    callback: (event: MouseEvent | TouchEvent) => void,
) => {
    useEffect(() => {
        if (!elementRefs?.length) return;
        const listener = (event: MouseEvent | TouchEvent) => {
            let clickInsideElements = false;

            elementRefs.forEach(elRef => {
                // Do nothing if clicking ref's element or descendent elements
                if (!elRef.current || elRef.current.contains(event.target as Node)) {
                    clickInsideElements = true;
                }
            });
            if (clickInsideElements) return;

            callback(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [elementRefs, callback]);
};
