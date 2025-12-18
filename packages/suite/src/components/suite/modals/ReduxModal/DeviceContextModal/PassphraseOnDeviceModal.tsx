import { useIntl } from 'react-intl';

import styled from 'styled-components';

import {
    selectIsDiscoveryStatusConfirmEmptyPassphrase,
    selectSelectedDeviceLabelOrName,
} from '@suite-common/wallet-core';
import { H2, Modal, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';
import type { TrezorDevice } from 'src/types/suite';

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
    const confirmEmptyPassphrase = useSelector(selectIsDiscoveryStatusConfirmEmptyPassphrase);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const onCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    return (
        <Modal.Backdrop onClick={onCancel}>
            <ConfirmOnDevicePill
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={onCancel}
            />
            <Modal.ModalBase width={400} data-testid="@modal/enter-passphrase-on-device">
                <ImageWrapper>
                    <DeviceConfirmImage device={device} />
                </ImageWrapper>

                <H2 align="center">
                    <Translation
                        id={
                            confirmEmptyPassphrase
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
                            confirmEmptyPassphrase
                                ? 'TR_THIS_HIDDEN_WALLET_IS_EMPTY_SOURCE'
                                : 'TR_PASSPHRASE_CASE_SENSITIVE'
                        }
                    />
                </Paragraph>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
