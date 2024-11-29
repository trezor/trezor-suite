import { deviceActions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

import { WelcomeLayout } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

import { SecurityCheckFail } from './SecurityCheckFail';

export const DeviceCompromised = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const goToSuite = () => {
        // Condition to satisfy TypeScript, device.id is always defined at this point.
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    return (
        <WelcomeLayout>
            <Card data-testid="@device-compromised">
                <SecurityCheckFail
                    goBack={goToSuite}
                    supportUrl={TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL}
                />
            </Card>
        </WelcomeLayout>
    );
};
