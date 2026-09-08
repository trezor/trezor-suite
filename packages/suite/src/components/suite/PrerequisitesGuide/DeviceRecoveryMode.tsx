import { type MouseEventHandler } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectRecoveryStatus } from '@suite/recovery';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { TrezorBodyIcon } from '@trezor/icons';

import { rerunRecoveryThunk } from 'src/actions/onboarding/onboardingActions';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useSelector } from 'src/hooks/suite';
import { selectOnboardedDevice } from 'src/selectors/onboarding/onboardingSelectors';

export const DeviceRecoveryMode = () => {
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const { dispatch } = useServices(selectDispatch);
    const onboardedDevice = useSelector(selectOnboardedDevice);

    const { isLocked } = useDevice();

    if (recoveryStatus === 'in-progress') {
        return null;
    }

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(rerunRecoveryThunk(onboardedDevice));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_IN_RECOVERY_MODE" />}
            cta={
                <Banner.Button isDisabled={isLocked()} onClick={handleClick}>
                    <Translation id="TR_CONTINUE" />
                </Banner.Button>
            }
            intent="warning"
            items={[
                {
                    key: 'recovery-mode',
                    heading: <Translation id="TR_DEVICE_IN_RECOVERY_MODE" />,
                    description: <Translation id="TR_DEVICE_IN_RECOVERY_MODE_DESC" />,
                    icon: TrezorBodyIcon,
                },
            ]}
        />
    );
};
