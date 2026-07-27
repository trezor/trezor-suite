import { Translation } from '@suite/intl';
import { Modal } from '@trezor/components';

import { SecurityCheckButton } from 'src/components/suite/SecurityCheck/SecurityCheckButton';
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
                    <SecurityCheckButton
                        intent="neutral"
                        priority="secondary"
                        onClick={handleClose}
                    >
                        <Translation id="TR_DISMISS" />
                    </SecurityCheckButton>
                </>
            }
            text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
        />
    </Modal>
);
