import { useEffect } from 'react';

import { gotoThunk } from '@suite/router';
import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

export const EarnTronRedirect = () => {
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
    }, [dispatch]);

    return null;
};
