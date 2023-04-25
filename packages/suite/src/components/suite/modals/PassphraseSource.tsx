import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { DeviceConfirmImage } from '@suite-components/images/DeviceConfirmImage';
import { useSelector } from '@suite-hooks';
import { selectIsDiscoveryAuthConfirmationRequired } from '@wallet-reducers/discoveryReducer';
import type { TrezorDevice } from '@suite-types';
import { DevicePromptModal } from '@suite-components/Modal/DevicePromptModal';

const StyledDevicePromptModal = styled(DevicePromptModal)`
    width: 360px;
`;

const StyledH1 = styled(H1)`
    margin-top: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface PassphraseSourceProps {
    device: TrezorDevice;
}

/**
 * Modal used with TT with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseSourceProps}
 */
export const PassphraseSource = ({ device }: PassphraseSourceProps) => {
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    return (
        <StyledDevicePromptModal
            isPillShown={!authConfirmation}
            data-test={
                authConfirmation ? '@modal/confirm-empty-hidden-wallet' : '@modal/passphrase-source'
            }
        >
            <DeviceConfirmImage device={device} />

            <StyledH1>
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_CONFIRM_PASSPHRASE_SOURCE'
                            : 'TR_SELECT_PASSPHRASE_SOURCE'
                    }
                    values={{ deviceLabel: device.label }}
                />
            </StyledH1>
        </StyledDevicePromptModal>
    );
};
