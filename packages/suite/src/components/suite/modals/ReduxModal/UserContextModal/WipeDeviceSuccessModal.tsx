import { Translation } from '@suite/intl';
import { closeModal } from '@suite/modal';
import { H3, Modal } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CheckIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

export const WipeDeviceSuccessModal = () => {
    const { dispatch } = useServices(injectDispatch);

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
            icon={CheckIcon}
        >
            <H3 typographyStyle="headline-md">
                <Translation id="TR_WIPE_DEVICE_SUCCESS_HEADING" />
            </H3>
        </Modal>
    );
};
