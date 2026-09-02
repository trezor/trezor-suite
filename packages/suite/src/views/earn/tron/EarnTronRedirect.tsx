import { useEffect } from 'react';

import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';

export const EarnTronRedirect = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
