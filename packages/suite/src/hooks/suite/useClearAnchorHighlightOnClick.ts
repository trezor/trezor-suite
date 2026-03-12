import { RefObject, useEffect } from 'react';

import { anchorChange, selectRouterAnchor } from '@suite/router';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';

export const useClearAnchorHighlightOnClick = (elementRef: RefObject<HTMLElement | null>) => {
    const anchor = useSelector(selectRouterAnchor);
    const dispatch = useDispatch();

    // Remove anchor highlight on click.
    useEffect(() => {
        // to assure propagation of click, which removes anchor highlight, work reliably
        // click listener has to be added on react container
        const parent = elementRef.current?.parentElement;
        const removeAnchor = () => anchor && dispatch(anchorChange());

        if (parent && anchor) {
            let frameId: number | null = null;

            frameId = requestAnimationFrame(() => {
                frameId = null;
                parent.addEventListener('click', removeAnchor);
            });

            return () => {
                if (frameId) {
                    cancelAnimationFrame(frameId);
                    frameId = null;
                }

                parent.removeEventListener('click', removeAnchor);
            };
        }
    }, [elementRef, anchor, dispatch]);
};
