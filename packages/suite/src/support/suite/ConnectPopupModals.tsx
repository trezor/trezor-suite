import { memo } from 'react';

import { useConnectPopupModals } from './useConnectPopupModals';

export const ConnectPopupModals = memo(() => {
    useConnectPopupModals();

    return null;
});

ConnectPopupModals.displayName = 'ConnectPopupModals';
