import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Modal } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import type { TrezorDevice } from '@suite-types';

const StyledModal = styled(Modal)`
    width: 360px;
`;

interface PassphraseOnDeviceProps {
    device: TrezorDevice;
}

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseOnDeviceProps}
 */
const PassphraseOnDevice = ({ device }: PassphraseOnDeviceProps) => {
    const { getDiscoveryAuthConfirmationStatus } = useActions({
        getDiscoveryAuthConfirmationStatus: discoveryActions.getDiscoveryAuthConfirmationStatus,
    });
    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

    return (
        <StyledModal
            heading={
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON'
                            : 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL'
                    }
                    values={{ deviceLabel: device.label }}
                />
            }
            description={
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE'
                            : 'TR_PASSPHRASE_CASE_SENSITIVE'
                    }
                />
            }
            devicePrompt={
                !authConfirmation ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    />
                ) : null
            }
            data-test="@modal/enter-passphrase-on-device"
        >
            <DeviceConfirmImage device={device} />
        </StyledModal>
    );
};

export default PassphraseOnDevice;
