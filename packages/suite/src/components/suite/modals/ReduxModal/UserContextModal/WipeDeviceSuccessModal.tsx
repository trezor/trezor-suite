import { Translation } from '@suite/intl';
import { onCancel as closeModal } from '@suite/modal';
import { H3, Modal } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

export const WipeDeviceSuccessModal = () => {
    const dispatch = useDispatch();

    const close = () => dispatch(closeModal());

    return (
        <Modal
            onCancel={close}
            bottomContent={
                <Modal.Button onClick={close}>
                    <Translation id="TR_BACK_TO_DASHBOARD" />
                </Modal.Button>
            }
            width={600}
            iconName="check"
        >
            <H3 typographyStyle="headline-md">
                <Translation id="TR_WIPE_DEVICE_SUCCESS_HEADING" />
            </H3>
        </Modal>
    );
};
