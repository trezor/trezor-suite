import styled from 'styled-components';

import { H2, variables } from '@trezor/components';
import { selectIsDiscoveryAuthConfirmationRequired } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import type { TrezorDevice } from 'src/types/suite';
import { DevicePromptModal } from './DevicePromptModal';

const StyledDevicePromptModal = styled(DevicePromptModal)`
    width: 360px;
`;

const StyledDeviceConfirmImage = styled(DeviceConfirmImage)`
    margin-top: -30px;
`;

const StyledH2 = styled(H2)`
    margin-top: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Tip = styled.span`
    margin-top: 12px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

interface PassphraseOnDeviceModalProps {
    device: TrezorDevice;
}

/**
 * Modal used with T2T1 with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseOnDeviceModalProps}
 */
export const PassphraseOnDeviceModal = ({ device }: PassphraseOnDeviceModalProps) => {
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    return (
        <StyledDevicePromptModal isAbortable={false} data-test="@modal/enter-passphrase-on-device">
            <StyledDeviceConfirmImage device={device} />

            <StyledH2>
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON'
                            : 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL'
                    }
                    values={{ deviceLabel: device.label }}
                />
            </StyledH2>

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
