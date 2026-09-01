import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { goto } from '@suite/router';

export const EarnTronRedirect = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(goto({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
