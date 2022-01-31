import { useRef, useEffect, useState } from 'react';

import { useSelector } from '@suite-hooks';

export const useAnchor = (anchorId: string) => {
    const { anchor } = useSelector(state => ({
        anchor: state.router.anchor,
    }));

    const anchorRef = useRef<HTMLDivElement>(null);
    const [isActive, setIsActive] = useState<boolean>(true);

    /* Removes highlight on user's click
     * Note:
     * There was an idea to do not remove it when user clicks on the specific item. However, there is a problem with modals.
     */
    const listener = () => setIsActive(false);

    useEffect(() => {
        if (anchorId === anchor && isActive && anchorRef.current) {
            const scrollTimeout = setTimeout(
                () =>
                    anchorRef?.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    }),
                0,
            );

            document.addEventListener('click', listener, {
                capture: true,
            });

            return () => {
                clearTimeout(scrollTimeout);
                document.removeEventListener('click', listener, {
                    capture: true,
                });
            };
        }
        if (!isActive && anchor !== anchorId) {
            console.log('kuk');
            setIsActive(true);
        }
    }, [anchorRef, anchor, anchorId, isActive]);

    return {
        anchorRef,
        shouldHighlight: anchorId === anchor && isActive,
    };
};
