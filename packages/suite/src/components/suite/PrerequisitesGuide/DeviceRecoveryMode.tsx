import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { recoveryRerun } from '@suite/onboarding';
import { selectRecoveryStatus } from '@suite/recovery';
import { Banner } from '@trezor/components';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

export const DeviceRecoveryMode = () => {
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const dispatch = useDispatch();

    const { isLocked } = useDevice();

    if (recoveryStatus === 'in-progress') {
        return null;
    }

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(recoveryRerun());
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
                    icon: 'trezorBody',
                },
            ]}
        />
    );
};
