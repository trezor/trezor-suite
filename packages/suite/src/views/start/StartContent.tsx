import { Card } from '@trezor/components';

import { PrerequisitesGuide } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';
import { type PrerequisiteType } from 'src/utils/suite/prerequisites';

import { ModalSwitcher } from '../../components/suite/modals/ModalSwitcher/ModalSwitcher';
import { SecurityCheck } from '../onboarding/steps/DeviceAuthenticityStep/SecurityCheck';

const startAppExcludedPrerequisites: PrerequisiteType[] = [
    'device-initialize',
    'firmware-missing',
    'device-recovery-mode',
];

/*
TODO rethink if this needs to act as a "fullscreen app".
SecurityCheck flow is currently handled by Preloader, but there is still the initialRun flow,
which navigates here and could rendere the selected prerequisites instead.
Need to be careful with the initialRun flow → what exactly does it do?
→ investigate if prerequisites can be moved, repurpose StartContent & SuiteStart for Preloader, remove flags.initialRun
 */
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

    // TODO AFUERA
    // Security check has to be without <ModalSwitcher /> as it handles the
    // button request without it. Its terrible, but it is what it is.
    return <SecurityCheck />;
};
