import { Card } from '@trezor/components';

import { PrerequisitesGuide } from 'src/components/suite';
import { InteractiveDeviceChecksFlow } from 'src/components/suite/SecurityCheck/InteractiveDeviceChecksFlow';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';
import { type PrerequisiteType } from 'src/utils/suite/prerequisites';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';

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

    // InteractiveDeviceChecksFlow has to be without <ModalSwitcher /> as it handles the
    // button request without it. Its terrible, but it is what it is.
    return <InteractiveDeviceChecksFlow />;
};
