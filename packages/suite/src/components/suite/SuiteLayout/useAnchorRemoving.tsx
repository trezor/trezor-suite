import { useEffect, useRef } from 'react';
import { useDispatch } from 'src/hooks/suite';
import { onAnchorChange } from 'src/actions/suite/routerActions';

export const useAnchorRemoving = (anchor: string | undefined) => {
    const ref = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();

    useEffect(() => {
        // to assure propagation of click, which removes anchor highlight, work reliably
        // click listener has to be added on react container
        const parent = ref.current?.parentElement;
        const removeAnchor = () => anchor && dispatch(onAnchorChange());

        if (parent && anchor) {
            parent.addEventListener('click', removeAnchor);
            return () => parent.removeEventListener('click', removeAnchor);
        }
    }, [anchor, dispatch, ref]);

    return ref;
};
