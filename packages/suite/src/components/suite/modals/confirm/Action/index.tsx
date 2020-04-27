import React from 'react';
import { Modal, ModalProps } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';

interface Props extends ModalProps {
    device: TrezorDevice;
}

const ConfirmAction = ({ device, ...rest }: Props) => {
    return (
        <Modal
            size="tiny"
            heading={
                <Translation
                    id="TR_CONFIRM_ACTION_ON_YOUR"
                    values={{ deviceLabel: device.label }}
                />
            }
            data-test="@suite/modal/confirm-action-on-device"
            {...rest}
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default ConfirmAction;
