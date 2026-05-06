import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { H2, Modal, Paragraph } from '@trezor/components';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import type { TrezorDevice } from 'src/types/suite';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

interface PassphraseOnDeviceModalViewProps {
    device: TrezorDevice;
    deviceLabel?: string;
    confirmEmptyPassphrase: boolean;
    onCancel: () => void;
}

export const PassphraseOnDeviceModalView = ({
    device,
    deviceLabel,
    confirmEmptyPassphrase,
    onCancel,
}: PassphraseOnDeviceModalViewProps) => (
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
                typographyStyle="body-xs"
                intent="neutral"
                priority="secondary"
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
