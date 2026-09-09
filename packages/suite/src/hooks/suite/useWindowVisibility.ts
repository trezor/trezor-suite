import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

import { updateWindowVisibility } from 'src/actions/suite/windowActions';

export const useWindowVisibility = () => {
    const { dispatch } = useServices(selectDispatch);

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
