import { Fingerprint } from '@suite/firmware-upgrade';
import { Translation } from '@suite/intl';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { Card, Modal } from '@trezor/components';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { ConfirmOnDevicePill } from '@trezor/product-components';

import { type TrezorDevice } from 'src/types/suite';

type ConfirmFingerprintProps = {
    device: TrezorDevice;
};

export const ConfirmFingerprintModal = ({ device }: ConfirmFingerprintProps) => (
    <Modal.Backdrop>
        <ConfirmOnDevicePill
            title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
            deviceModelInternal={getDeviceInternalModel(device)}
            deviceUnitColor={getDeviceColorVariant(device)}
        />
        <Modal.ModalBase
            heading={<Translation id="TR_CHECK_FINGERPRINT" />}
            data-testid="@suite/modal/confirm-fingerprint-on-device"
            width={400}
        >
            <Card>
                <Fingerprint device={device} />
            </Card>
        </Modal.ModalBase>
    </Modal.Backdrop>
);
