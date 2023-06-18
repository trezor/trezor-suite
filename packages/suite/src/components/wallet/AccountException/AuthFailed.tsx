import React from 'react';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { useDevice, useActions } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

const AuthFailed = () => {
    const { isLocked } = useDevice();
    const { authDevice } = useActions({
        authDevice: suiteActions.authorizeDevice,
    });
    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC" />}
            image="UNI_ERROR"
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
