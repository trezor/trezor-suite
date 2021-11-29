import React from 'react';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';
import { Translation } from '@suite-components';
import { AccountExceptionLayout } from '@wallet-components';

const AuthFailed = () => {
    const { isLocked } = useDevice();
    const { authDevice } = useActions({
        authDevice: suiteActions.authorizeDevice,
    });
    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC" />}
            image="UNIVERSAL_ERROR"
            actions={[
                {
                    key: '1',
                    icon: 'REFRESH',
                    isLoading: isLocked(),
                    onClick: authDevice,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};

export default AuthFailed;
