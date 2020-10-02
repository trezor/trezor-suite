import React from 'react';
import { NotificationCard, Translation } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';

const AuthConfirmFailed = () => {
    const { isLocked } = useDevice();
    const { authConfirm } = useActions({
        authConfirm: suiteActions.authConfirm,
    });
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
