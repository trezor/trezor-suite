import { OnboardingStepBox } from 'src/components/onboarding';
import { PrerequisitesGuide } from 'src/components/suite/PrerequisitesGuide/PrerequisitesGuide';

export const DeviceDisconnectedStep = () => (
    <OnboardingStepBox image="CONNECT_DEVICE" device={undefined}>
        <PrerequisitesGuide
            // Onboarding is small (vertically) so we hide the image to make it fit
            showDeviceImage={false}
        />
    </OnboardingStepBox>
);
