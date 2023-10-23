import { MouseEventHandler } from 'react';
import { Button } from '@trezor/components';
import { Translation, TroubleshootingTips } from 'src/components/suite';
import { rerun } from 'src/actions/recovery/recoveryActions';
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
                <Button isDisabled={isLocked()} onClick={handleClick}>
                    <Translation id="TR_CONTINUE" />
                </Button>
            }
            items={[
                {
                    key: 'recovery-mode',
                    heading: <Translation id="TR_DEVICE_IN_RECOVERY_MODE" />,
                    description: <Translation id="TR_DEVICE_IN_RECOVERY_MODE_DESC" />,
                },
            ]}
        />
    );
};
