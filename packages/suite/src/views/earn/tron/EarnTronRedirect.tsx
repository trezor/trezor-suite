import { useEffect } from 'react';

import { goto } from '@suite/router';

import { useDispatch } from 'src/hooks/suite';

export const EarnTronRedirect = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(goto({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
