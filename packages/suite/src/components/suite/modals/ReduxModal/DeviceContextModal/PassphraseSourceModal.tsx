import styled from 'styled-components';

import { H2, variables } from '@trezor/components';
import {
    selectDeviceLabelOrName,
    selectIsDiscoveryAuthConfirmationRequired,
} from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite/Translation';
import { DeviceConfirmImage } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import type { TrezorDevice } from 'src/types/suite';
import { DevicePromptModal } from './DevicePromptModal';

const StyledDevicePromptModal = styled(DevicePromptModal)`
    width: 360px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledH2 = styled(H2)`
    margin-top: 12px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface PassphraseSourceModalProps {
    device: TrezorDevice;
}

/**
 * Modal used with T2T1 with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseSourceModalProps}
 */
export const PassphraseSourceModal = ({ device }: PassphraseSourceModalProps) => {
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;
    const deviceLabel = useSelector(selectDeviceLabelOrName);

    return (
        <StyledDevicePromptModal
            isPillShown={!authConfirmation}
            data-testid={
                authConfirmation ? '@modal/confirm-empty-hidden-wallet' : '@modal/passphrase-source'
            }
        >
            <DeviceConfirmImage device={device} />

            <StyledH2>
                <Translation
                    id={
                        authConfirmation
                            ? 'TR_CONFIRM_PASSPHRASE_SOURCE'
                            : 'TR_SELECT_PASSPHRASE_SOURCE'
                    }
                    values={{ deviceLabel }}
                />
            </StyledH2>
        </StyledDevicePromptModal>
    );
};
