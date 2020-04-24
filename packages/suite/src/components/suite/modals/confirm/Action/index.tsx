import React from 'react';
import { Modal } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { TrezorDevice } from '@suite-types';

interface Props {
    device: TrezorDevice;
}

const ConfirmAction = ({ device }: Props) => {
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
        >
            <DeviceConfirmImage device={device} />
        </Modal>
    );
};

export default ConfirmAction;
