import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { DeviceConfirmImage } from 'src/components/suite/images/DeviceConfirmImage';
import { useSelector } from 'src/hooks/suite';
import { selectIsDiscoveryAuthConfirmationRequired } from 'src/reducers/wallet/discoveryReducer';
import type { TrezorDevice } from 'src/types/suite';
import { DevicePromptModal } from 'src/components/suite/Modal/DevicePromptModal';

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
