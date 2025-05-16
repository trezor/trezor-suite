// todo
// import { authorizeDeviceThunk } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';
import { useDevice } from 'src/hooks/suite';

export const AuthFailed = () => {
    // const dispatch = useDispatch();
    const { isLocked } = useDevice();

    // const handleClick = () => dispatch(authorizeDeviceThunk());
    const handleClick = () => {};

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC" />}
            iconName="warning"
            iconVariant="warning"
            actions={[
                {
                    key: '1',
                    icon: 'repeat',
                    isLoading: isLocked(),
                    onClick: handleClick,
                    children: <Translation id="TR_RETRY" />,
                },
            ]}
        />
    );
};
