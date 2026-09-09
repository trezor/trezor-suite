import { useEffect } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

export const EarnTronRedirect = () => {
    const { dispatch } = useServices(selectDispatch);

    useEffect(() => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
