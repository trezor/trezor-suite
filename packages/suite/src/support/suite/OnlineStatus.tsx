import { useEffect } from 'react';
import { useActions } from '@suite-hooks/useActions';
import { updateOnlineStatus } from '@suite-actions/suiteActions';

/**
 * Navigator online/offline handler
 * Handle changes of state and dispatch Action with current state to the reducer
 * @returns null
 */

const OnlineStatus = () => {
    const actions = useActions({ updateOnlineStatus });
    useEffect(() => {
        const statusHandler = () => {
            actions.updateOnlineStatus(navigator.onLine);
        };

        // handle browser back button
        window.addEventListener('online', statusHandler);
        window.addEventListener('offline', statusHandler);

        statusHandler();

        return () => {
            window.removeEventListener('online', statusHandler, false);
            window.removeEventListener('offline', statusHandler, false);
        };
    }, [actions]);

    return null;
};

export default OnlineStatus;
