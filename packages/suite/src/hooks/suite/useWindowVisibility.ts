import { useEffect } from 'react';

import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

import { updateWindowVisibility } from 'src/actions/suite/windowActions';

export const useWindowVisibility = () => {
    const { dispatch } = useServices(injectDispatch);

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
