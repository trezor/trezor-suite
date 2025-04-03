import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { H2, NewModal } from '@trezor/components';
import { ConfirmOnDevice } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { DeviceConfirmImage } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';

type PinInvalidModalProps = {
    device: TrezorDevice;
};

export const PinInvalidModal = ({ device }: PinInvalidModalProps) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    return (
        <NewModal.Backdrop>
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
            />
            <NewModal.ModalBase size="tiny">
                <DeviceConfirmImage device={device} />
                <H2
                    align="center"
                    margin={{ left: spacings.md, right: spacings.md, bottom: spacings.md }}
                >
                    <Translation id="TR_ENTERED_PIN_NOT_CORRECT" values={{ deviceLabel }} />
                </H2>
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
