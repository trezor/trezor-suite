import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Modal } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { DeviceConfirmImage } from '@suite-components/images/DeviceConfirmImage';
import { useActions } from '@suite-hooks';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import type { TrezorDevice } from '@suite-types';

const StyledModal = styled(Modal)`
    width: 360px;
`;

interface PassphraseSourceProps {
    device: TrezorDevice;
}

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseSourceProps}
 */
export const PassphraseSource = ({ device }: PassphraseSourceProps) => {
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
                            ? 'TR_CONFIRM_PASSPHRASE_SOURCE'
                            : 'TR_SELECT_PASSPHRASE_SOURCE'
                    }
                    values={{ deviceLabel: device.label }}
                />
            }
            devicePrompt={
                !authConfirmation ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device.features?.major_version === 1 ? 1 : 2}
                        animated
                    />
                ) : null
            }
            data-test={
                authConfirmation ? '@modal/confirm-empty-hidden-wallet' : '@modal/passphrase-source'
            }
        >
            <DeviceConfirmImage device={device} />
        </StyledModal>
    );
};
