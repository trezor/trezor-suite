import React from 'react';
import DiscoveryLoader from '@suite-components/DiscoveryLoader';
import { usePreferredModal } from '@suite-hooks/usePreferredModal';

import { ReduxModal } from './ReduxModal';
import { ForegroundAppModal } from './ForegroundAppModal';

/** Displays whichever redux modal or foreground app should be displayed */
export const ModalSwitcher = () => {
    const modal = usePreferredModal();
    switch (modal.type) {
        case 'foreground-app':
            return <ForegroundAppModal {...modal.payload} />;
        case 'redux-modal':
            return <ReduxModal {...modal.payload} />;
        case 'discovery-loading':
            return <DiscoveryLoader />;
        default:
            return null;
    }
};
