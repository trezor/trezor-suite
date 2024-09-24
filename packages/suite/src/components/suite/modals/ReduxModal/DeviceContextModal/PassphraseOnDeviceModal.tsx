import styled from 'styled-components';
import { useIntl } from 'react-intl';

import { H2, NewModal, Paragraph } from '@trezor/components';
import { ConfirmOnDevice } from '@trezor/product-components';
import {
    selectDeviceLabelOrName,
    selectIsDiscoveryAuthConfirmationRequired,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import type { TrezorDevice } from 'src/types/suite';
import messages from 'src/support/messages';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

interface PassphraseOnDeviceModalProps {
    device: TrezorDevice;
}

/**
 * Modal used with T2T1 with legacy firmware as result of 'ButtonRequest_PassphraseType' where passphrase source is requested on device
 * @param {PassphraseOnDeviceModalProps}
 */
export const PassphraseOnDeviceModal = ({ device }: PassphraseOnDeviceModalProps) => {
    const intl = useIntl();
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;
    const deviceLabel = useSelector(selectDeviceLabelOrName);

    const onCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    return (
        <NewModal.Backdrop onClick={onCancel}>
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={onCancel}
            />
            <NewModal.ModalBase size="tiny" data-testid="@modal/enter-passphrase-on-device">
                <ImageWrapper>
                    <DeviceConfirmImage device={device} />
                </ImageWrapper>

                <H2 align="center">
                    <Translation
                        id={
                            authConfirmation
                                ? 'TR_CONFIRM_EMPTY_HIDDEN_WALLET_ON'
                                : 'TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL'
                        }
                        values={{ deviceLabel }}
                    />
                </H2>

                <Paragraph
                    align="center"
                    typographyStyle="label"
                    variant="tertiary"
                    margin={{ top: spacings.md }}
                >
                    <Translation
                        id={
                            authConfirmation
                                ? 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE'
                                : 'TR_PASSPHRASE_CASE_SENSITIVE'
                        }
                    />
                </Paragraph>
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
