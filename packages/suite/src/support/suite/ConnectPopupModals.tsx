import { memo } from 'react';

import { useConnectPopupModals } from './useConnectPopupModals';

// The hook subscribes to the route and the modal state. Kept in a memoized leaf that renders
// nothing so that those changes re-render only this component instead of the whole app through Main.
export const ConnectPopupModals = memo(() => {
    useConnectPopupModals();

    return null;
});

ConnectPopupModals.displayName = 'ConnectPopupModals';
