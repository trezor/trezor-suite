import { usePreferredModal } from 'src/hooks/suite/usePreferredModal';
import { ReduxModal } from '../ReduxModal/ReduxModal';
import { ForegroundAppModal } from './ForegroundAppModal';
import { DiscoveryLoader } from './DiscoveryLoader';
import { useSelector } from 'src/hooks/suite';
import { DiscoveryLoaderLegacy } from './DiscoveryLoaderLegacy';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

/** Displays whichever redux modal or foreground app should be displayed */
export const ModalSwitcher = () => {
    const { isViewOnlyModeVisible } = useSelector(selectSuiteFlags);
    const modal = usePreferredModal();

    switch (modal.type) {
        case 'foreground-app':
            return <ForegroundAppModal {...modal.payload} />;
        case 'redux-modal':
            return <ReduxModal {...modal.payload} />;
        case 'discovery-loading':
            return isViewOnlyModeVisible ? <DiscoveryLoader /> : <DiscoveryLoaderLegacy />;
        default:
            return null;
    }
};
