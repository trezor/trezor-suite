import { useRef, useEffect } from 'react';

import { useSelector } from '@suite-hooks';

export const useAnchor = (anchorId: string) => {
    const anchorRef = useRef<HTMLDivElement>(null);

    const anchor = useSelector(state => state.router.anchor);

    useEffect(() => {
        if (anchorId === anchor && anchorRef.current) {
            // scroll to anchor, has to be delayed to allow proper render of components
            // note: we cannot easily remove highlight on manual scroll because scroll listener is also activated by "scrollIntoView"
            const scrollTimeout = setTimeout(
                () =>
                    anchorRef?.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    }),
                0,
            );

            return () => clearTimeout(scrollTimeout);
        }
    }, [anchor, anchorId]);

    return {
        anchorRef,
        shouldHighlight: anchorId === anchor,
    };
};
