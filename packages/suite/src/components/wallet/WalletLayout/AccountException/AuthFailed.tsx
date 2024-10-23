import { authorizeDeviceThunk } from '@suite-common/wallet-core';

import { useDevice, useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

export const AuthFailed = () => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const handleClick = () => dispatch(authorizeDeviceThunk());

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC" />}
            iconName="warning"
            iconVariant="warning"
            actions={[
                {
                    key: '1',
                    icon: 'refresh',
                    isLoading: isLocked(),
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};
