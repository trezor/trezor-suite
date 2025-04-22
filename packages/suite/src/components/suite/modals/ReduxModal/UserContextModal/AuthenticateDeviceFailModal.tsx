import { Card, Modal } from '@trezor/components';
import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL } from '@trezor/urls';

import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';

export const AuthenticateDeviceFailModal = () => (
    <Modal>
        <Card>
            <SecurityCheckFail
                supportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL}
                text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
            />
        </Card>
    </Modal>
);
