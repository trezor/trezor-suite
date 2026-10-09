import { useEffect } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const EarnTronRedirect = () => {
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
