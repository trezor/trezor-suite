import React from 'react';
import { NotificationCard, Translation } from 'src/components/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { useDevice, useActions } from 'src/hooks/suite';

const AuthConfirmFailed = () => {
    const { device, isLocked } = useDevice();
    const { authConfirm } = useActions({
        authConfirm: suiteActions.authConfirm,
    });

    if (!device?.connected || !device.authConfirm) return null;

    return (
        <NotificationCard
            variant="warning"
            button={{
                onClick: authConfirm,
                isLoading: isLocked(),
                icon: 'REFRESH',
                'data-test': '@passphrase-mismatch/retry-button',
                children: <Translation id="TR_AUTH_CONFIRM_FAILED_RETRY" />,
            }}
        >
            <Translation id="TR_AUTH_CONFIRM_FAILED_TITLE" />
        </NotificationCard>
    );
};

export default AuthConfirmFailed;
