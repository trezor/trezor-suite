import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Translation, Modal, ModalProps } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { Fingerprint } from 'src/components/firmware';
import { getDeviceModel } from '@trezor/device-utils';

const StyledModal = styled(Modal)`
    width: 360px;
`;

interface ConfirmFingerprintProps extends ModalProps {
    device: TrezorDevice;
}

export const ConfirmFingerprintModal = ({ device, ...rest }: ConfirmFingerprintProps) => (
    <StyledModal
        modalPrompt={
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModel={getDeviceModel(device)}
            />
        }
        heading={<Translation id="TR_CHECK_FINGERPRINT" />}
        data-test="@suite/modal/confirm-fingerprint-on-device"
        {...rest}
    >
        <Fingerprint device={device} />
    </StyledModal>
);
