import { useRef, useEffect } from 'react';

import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

export const useAnchor = (anchorId: string) => {
    const anchorRef = useRef<HTMLDivElement>(null);

    const { anchor } = useSelector(state => ({
        anchor: state.router.anchor,
    }));

    const { onAnchorChange } = useActions({
        onAnchorChange: routerActions.onAnchorChange,
    });

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
    }, [anchorRef, anchor, anchorId, onAnchorChange]);

    return {
        anchorRef,
        shouldHighlight: anchorId === anchor,
    };
};
