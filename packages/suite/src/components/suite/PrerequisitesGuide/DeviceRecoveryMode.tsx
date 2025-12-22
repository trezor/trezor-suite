import { MouseEventHandler } from 'react';

import { Banner } from '@trezor/components';

import { rerun } from 'src/actions/recovery/recoveryActions';
import { Translation } from 'src/components/suite/Translation';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

export const DeviceRecoveryMode = () => {
    const recovery = useSelector(state => state.recovery);
    const dispatch = useDispatch();

    const { isLocked } = useDevice();

    if (recovery.status === 'in-progress') {
        return null;
    }

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(rerun());
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
