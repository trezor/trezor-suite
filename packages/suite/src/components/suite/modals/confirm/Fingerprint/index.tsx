import React from 'react';
import { Modal, ModalProps, ConfirmOnDevice } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { TrezorDevice } from '@suite-types';
import { Fingerprint } from '@firmware-components';

interface Props extends ModalProps {
    device: TrezorDevice;
}

const ConfirmFingerprint = ({ device, ...rest }: Props) => (
    <Modal
        size="tiny"
        header={
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                trezorModel={device.features?.major_version === 1 ? 1 : 2}
                animated
            />
        }
        heading={<Translation id="TR_CHECK_FINGERPRINT" />}
        data-test="@suite/modal/confirm-fingerprint-on-device"
        {...rest}
    >
        <Fingerprint device={device} />
    </Modal>
);

export default ConfirmFingerprint;
