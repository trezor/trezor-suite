import React from 'react';
import { Button, colors } from '@trezor/components';
import { NotificationCard, Translation } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';

const AuthConfirmFailed = () => {
    const { isLocked } = useDevice();
    const { authConfirm } = useActions({
        authConfirm: suiteActions.authConfirm,
    });
    return (
        <NotificationCard variant="warning">
            <Translation id="TR_AUTH_CONFIRM_FAILED_TITLE" />
            <Button
                data-test="@passphrase-mismatch/retry-button"
                variant="tertiary"
                icon="REFRESH"
                color={colors.RED_ERROR}
                onClick={authConfirm}
                isLoading={isLocked()}
            >
                <Translation id="TR_AUTH_CONFIRM_FAILED_RETRY" />
            </Button>
        </NotificationCard>
    );
};

export default AuthConfirmFailed;
