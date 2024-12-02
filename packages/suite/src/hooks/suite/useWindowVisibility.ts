import { useEffect } from 'react';

import { updateWindowVisibility } from 'src/actions/suite/windowActions';

import { useDispatch } from './useDispatch';

export const useWindowVisibility = () => {
    const dispatch = useDispatch();

    const onWindowVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            dispatch(updateWindowVisibility(false));
        } else {
            dispatch(updateWindowVisibility(true));
        }
    };

    useEffect(() => {
        document.addEventListener('visibilitychange', onWindowVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onWindowVisibilityChange);
        };
    });
};
