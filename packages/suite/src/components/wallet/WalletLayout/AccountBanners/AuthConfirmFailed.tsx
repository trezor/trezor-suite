import { authConfirm } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const AuthConfirmFailed = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    if (!device?.connected || !device.authConfirm) return null;

    const handleClick = () => dispatch(authConfirm());

    return (
        <Banner
            variant="warning"
            rightContent={
                <Banner.Button
                    onClick={handleClick}
                    isLoading={isLocked()}
                    icon="refresh"
                    data-testid="@passphrase-mismatch/retry-button"
                >
                    <Translation id="TR_AUTH_CONFIRM_FAILED_RETRY" />
                </Banner.Button>
            }
        >
            <Translation id="TR_AUTH_CONFIRM_FAILED_TITLE" />
        </Banner>
    );
};
