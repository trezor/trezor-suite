import { Translation } from '@suite/intl';
import { Button, Modal } from '@trezor/components';

import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { AuthenticateDeviceSupportButton } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';

type AuthenticateDeviceFailStepProps = {
    handleClose: () => void;
};
export const AuthenticateDeviceFailStep = ({ handleClose }: AuthenticateDeviceFailStepProps) => (
    <Modal>
        <SecurityCheckFail
            ctaSection={
                <>
                    <AuthenticateDeviceSupportButton />
                    <Button intent="neutral" priority="secondary" onClick={handleClose}>
                        <Translation id="TR_DISMISS" />
                    </Button>
                </>
            }
            text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
        />
    </Modal>
);
