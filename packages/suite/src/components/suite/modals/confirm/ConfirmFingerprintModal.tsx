import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Translation, Modal, ModalProps } from '@suite-components';
import { TrezorDevice } from '@suite-types';
import { Fingerprint } from '@firmware-components';

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
                trezorModel={device.features?.major_version === 1 ? 1 : 2}
            />
        }
        heading={<Translation id="TR_CHECK_FINGERPRINT" />}
        data-test="@suite/modal/confirm-fingerprint-on-device"
        {...rest}
    >
        <Fingerprint device={device} />
    </StyledModal>
);
