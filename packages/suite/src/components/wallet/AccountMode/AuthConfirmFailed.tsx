import { NotificationCard, Translation } from 'src/components/suite';
import { authConfirm } from 'src/actions/suite/suiteActions';
import { useDevice, useDispatch } from 'src/hooks/suite';

const AuthConfirmFailed = () => {
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
                'data-test': '@passphrase-mismatch/retry-button',
                children: <Translation id="TR_AUTH_CONFIRM_FAILED_RETRY" />,
            }}
        >
            <Translation id="TR_AUTH_CONFIRM_FAILED_TITLE" />
        </NotificationCard>
    );
};

export default AuthConfirmFailed;
