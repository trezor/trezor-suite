import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { DeviceConfirmImage } from '@suite-components/images/DeviceConfirmImage';
import { useActions } from '@suite-hooks';
import * as discoveryActions from '@wallet-actions/discoveryActions';
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
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseSourceProps}
 */
export const PassphraseSource = ({ device }: PassphraseSourceProps) => {
    const { getDiscoveryAuthConfirmationStatus } = useActions({
        getDiscoveryAuthConfirmationStatus: discoveryActions.getDiscoveryAuthConfirmationStatus,
    });

    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

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
