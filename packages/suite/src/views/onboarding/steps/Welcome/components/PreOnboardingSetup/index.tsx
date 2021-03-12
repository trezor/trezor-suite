import React from 'react';
import { useOnboarding, useSelector } from '@suite-hooks';
import { getConnectedDeviceStatus } from '@suite-utils/device';
import DataAnalytics from './DataAnalytics';
import SecurityCheck from './SecurityCheck';

const PreOnboardingSetup = () => {
    const { activeSubStep } = useOnboarding();
    const { initialRun, device } = useSelector(s => ({
        initialRun: s.suite.flags.initialRun,
        device: s.suite.device,
    }));

    const deviceStatus = getConnectedDeviceStatus(device);

    if (activeSubStep === 'security-check' || !initialRun) {
        // If it is not an initial run of onboarding, but rather user came to setup new device we don't won't ask to about data collection/analytics again.
        // And only show this 2nd substep
        return (
            <SecurityCheck
                initialized={deviceStatus === 'initialized'}
                trezorModel={device?.features?.major_version === 1 ? 1 : 2}
            />
        );
    }

    // 1st substep
    return <DataAnalytics />;
};

export default PreOnboardingSetup;
