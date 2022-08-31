import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { DeviceConfirmImage } from '@suite-components/images/DeviceConfirmImage';
import type { TrezorDevice } from '@suite-types';
import { DevicePromptModal } from '@suite-components/Modal/DevicePromptModal';

const StyledDevicePromptModal = styled(DevicePromptModal)`
    width: 360px;
`;

const StyledDeviceConfirmImage = styled(DeviceConfirmImage)`
    margin-top: -30px;
`;

const StyledH1 = styled(H1)`
    margin-top: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Tip = styled.span`
    margin-top: 12px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

interface PassphraseOnDeviceProps {
    device: TrezorDevice;
}

/**
 * Modal used with model T with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseOnDeviceProps}
 */
export const PassphraseOnDevice = ({ device }: PassphraseOnDeviceProps) => {
    const { getDiscoveryAuthConfirmationStatus } = useActions({
        getDiscoveryAuthConfirmationStatus: discoveryActions.getDiscoveryAuthConfirmationStatus,
    });

    const authConfirmation = getDiscoveryAuthConfirmationStatus() || device.authConfirm;

    return (
        <StyledDevicePromptModal isAbortable={false} data-test="@modal/enter-passphrase-on-device">
            <StyledDeviceConfirmImage device={device} />

            <StyledH1>
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON'
                            : 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL'
                    }
                    values={{ deviceLabel: device.label }}
                />
            </StyledH1>

            <Tip>
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE'
                            : 'TR_PASSPHRASE_CASE_SENSITIVE'
                    }
                />
            </Tip>
        </StyledDevicePromptModal>
    );
};
