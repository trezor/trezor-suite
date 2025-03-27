import { Card, NewModal } from '@trezor/components';
import { ConfirmOnDevice } from '@trezor/product-components';

import { Fingerprint } from 'src/components/firmware';
import { Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';

type ConfirmFingerprintProps = {
    device: TrezorDevice;
};

export const ConfirmFingerprintModal = ({ device }: ConfirmFingerprintProps) => (
    <NewModal.Backdrop>
        <ConfirmOnDevice
            title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
            deviceModelInternal={device.features?.internal_model}
            deviceUnitColor={device?.features?.unit_color}
        />
        <NewModal.ModalBase
            heading={<Translation id="TR_CHECK_FINGERPRINT" />}
            data-testid="@suite/modal/confirm-fingerprint-on-device"
            size="tiny"
        >
            <Card>
                <Fingerprint device={device} />
            </Card>
        </NewModal.ModalBase>
    </NewModal.Backdrop>
);
