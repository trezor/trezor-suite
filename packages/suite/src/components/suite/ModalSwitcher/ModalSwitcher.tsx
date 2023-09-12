import { DiscoveryLoader } from 'src/components/suite/modals/DiscoveryLoader';
import { usePreferredModal } from 'src/hooks/suite/usePreferredModal';
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
