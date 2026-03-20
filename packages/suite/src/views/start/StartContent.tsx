import type { PrerequisiteType } from '@suite/prerequisites';
import { Card } from '@trezor/components';

import { PrerequisitesGuide } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';
import { SecurityCheck } from '../onboarding/steps/DeviceAuthenticityStep/SecurityCheck';

const startAppExcludedPrerequisites: PrerequisiteType[] = [
    'device-initialize',
    'firmware-missing',
    'device-recovery-mode',
];

export const StartContent = () => {
    const prerequisite = useSelector(selectPrerequisite);

    if (prerequisite !== null && !startAppExcludedPrerequisites.includes(prerequisite)) {
        return (
            <Card>
                <ModalSwitcher />
                <PrerequisitesGuide />
            </Card>
        );
    }

    // Security check has to be without <ModalSwitcher /> as it handles the
    // button request without it. Its terrible, but it is what it is.
    return <SecurityCheck />;
};
