import { authConfirm } from '@suite-common/wallet-core';

import { NotificationCard, Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const AuthConfirmFailed = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    if (!device?.connected || !device.authConfirm) return null;

    const handleClick = () => dispatch(authConfirm());

    return (
        <NotificationCard
            variant="warning"
            button={{
                onClick: handleClick,
                isLoading: isLocked(),
                icon: 'REFRESH',
                'data-test-id': '@passphrase-mismatch/retry-button',
                children: <Translation id="TR_AUTH_CONFIRM_FAILED_RETRY" />,
            }}
        >
            <Translation id="TR_AUTH_CONFIRM_FAILED_TITLE" />
        </NotificationCard>
    );
};
