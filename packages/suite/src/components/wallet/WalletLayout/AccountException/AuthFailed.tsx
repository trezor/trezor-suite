import { authorizeDevice } from '@suite-common/wallet-core';

import { useDevice, useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

export const AuthFailed = () => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const handleClick = () => dispatch(authorizeDevice());

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
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};
