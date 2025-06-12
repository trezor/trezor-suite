import { PrerequisitesGuide } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/reducers/suite/suiteReducer';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';
import { SecurityCheck } from '../onboarding/steps/SecurityCheck/SecurityCheck';

export const StartContent = () => {
    const prerequisite = useSelector(selectPrerequisite);

    if (
        prerequisite &&
        !['device-initialize', 'firmware-missing', 'device-recovery-mode'].includes(prerequisite)
    ) {
        return (
            <>
                <ModalSwitcher />
                <PrerequisitesGuide />
            </>
        );
    }

    // Security check has to be without <ModalSwitcher /> as it handles the
    // button request without it. Its terrible, but it is what it is.
    return <SecurityCheck />;
};
