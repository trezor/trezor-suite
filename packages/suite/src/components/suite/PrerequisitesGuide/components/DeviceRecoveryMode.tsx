import React from 'react';
import { Button } from '@trezor/components';
import { Translation, TroubleshootingTips } from '@suite-components';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';

export const DeviceRecoveryMode = () => {
    const recovery = useSelector(state => state.recovery);
    const { rerun } = useActions({ rerun: recoveryActions.rerun });

    const { isLocked } = useDevice();

    if (recovery.status === 'in-progress') {
        return null;
    }

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_IN_RECOVERY_MODE" />}
            cta={
                <Button
                    isDisabled={isLocked()}
                    onClick={e => {
                        e.stopPropagation();
                        rerun();
                    }}
                >
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
