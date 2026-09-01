import { useEffect } from 'react';

import { goto } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';

export const EarnTronRedirect = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(goto({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
