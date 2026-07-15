import { OnboardingCard } from '@suite/onboarding-components';
import { PlugsConnectedIcon } from '@trezor/icons';

import { PrerequisitesGuide } from 'src/components/suite/PrerequisitesGuide/PrerequisitesGuide';

export const DeviceDisconnectedStep = () => (
    <OnboardingCard icon={PlugsConnectedIcon} device={undefined}>
        <PrerequisitesGuide
            // Onboarding is small (vertically) so we hide the image to make it fit
            showDeviceImage={false}
        />
    </OnboardingCard>
);
