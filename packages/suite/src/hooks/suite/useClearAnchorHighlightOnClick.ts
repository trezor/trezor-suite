import { RefObject, useEffect } from 'react';
import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';
import { onAnchorChange } from 'src/actions/suite/routerActions';

export const useClearAnchorHighlightOnClick = (elementRef: RefObject<HTMLElement>) => {
    const anchor = useSelector(state => state.router.anchor);
    const dispatch = useDispatch();

    // Remove anchor highlight on click.
    useEffect(() => {
        // to assure propagation of click, which removes anchor highlight, work reliably
        // click listener has to be added on react container
        const parent = elementRef.current?.parentElement;
        const removeAnchor = () => anchor && dispatch(onAnchorChange());

        if (parent && anchor) {
            parent.addEventListener('click', removeAnchor);

            return () => parent.removeEventListener('click', removeAnchor);
        }
    }, [elementRef, anchor, dispatch]);
};
