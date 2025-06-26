import { useDispatch } from 'react-redux';

import { Button, Modal } from '@trezor/components';

import { onCancel } from 'src/actions/suite/modalActions';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { AuthenticateDeviceSupportButton } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';
import { Translation } from 'src/components/suite/Translation';

export const AuthenticateDeviceFailModal = () => {
    const dispatch = useDispatch();

    const close = () => dispatch(onCancel());

    return (
        <Modal>
            <SecurityCheckFail
                ctaSection={
                    <>
                        <AuthenticateDeviceSupportButton />
                        <Button variant="tertiary" onClick={close}>
                            <Translation id="TR_DISMISS" />
                        </Button>
                    </>
                }
                text="TR_DEVICE_COMPROMISED_DEVICE_AUTHENTICITY_TEXT"
            />
        </Modal>
    );
};
