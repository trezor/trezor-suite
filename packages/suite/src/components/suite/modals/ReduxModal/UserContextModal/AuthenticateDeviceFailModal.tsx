import { Card, Modal } from '@trezor/components';

import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { AuthenticateDeviceSupportButton } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';

export const AuthenticateDeviceFailModal = () => (
    <Modal>
        <Card>
            <SecurityCheckFail
                ctaSection={<AuthenticateDeviceSupportButton />}
                text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
            />
        </Card>
    </Modal>
);
