import { Modal, NewButton } from '@trezor/components';

import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { AuthenticateDeviceSupportButton } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';
import { Translation } from 'src/components/suite/Translation';

type AuthenticateDeviceFailStepProps = {
    handleClose: () => void;
};
export const AuthenticateDeviceFailStep = ({ handleClose }: AuthenticateDeviceFailStepProps) => (
    <Modal>
        <SecurityCheckFail
            ctaSection={
                <>
                    <AuthenticateDeviceSupportButton />
                    <NewButton intent="neutral" priority="secondary" onClick={handleClose}>
                        <Translation id="TR_DISMISS" />
                    </NewButton>
                </>
            }
            text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
        />
    </Modal>
);
