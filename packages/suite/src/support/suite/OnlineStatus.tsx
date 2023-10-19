import { useEffect } from 'react';
import { useDispatch } from 'src/hooks/suite';
import { updateOnlineStatus } from 'src/actions/suite/suiteActions';

/**
 * Navigator online/offline handler
 * Handle changes of state and dispatch Action with current state to the reducer
 * @returns null
 */

const OnlineStatus = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const statusHandler = () => {
            dispatch(updateOnlineStatus(navigator.onLine));
        };

        // handle browser back button
        window.addEventListener('online', statusHandler);
        window.addEventListener('offline', statusHandler);

        statusHandler();

        return () => {
            window.removeEventListener('online', statusHandler, false);
            window.removeEventListener('offline', statusHandler, false);
        };
    }, [dispatch]);

    return null;
};

export default OnlineStatus;
