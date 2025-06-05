import { getDeviceColorVariant, getDeviceInternalModel } from '@suite-common/suite-utils';
import { Card, Modal } from '@trezor/components';
import { ConfirmOnDevice } from '@trezor/product-components';

import { Fingerprint } from 'src/components/firmware';
import { Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';

type ConfirmFingerprintProps = {
    device: TrezorDevice;
};

export const ConfirmFingerprintModal = ({ device }: ConfirmFingerprintProps) => (
    <Modal.Backdrop>
        <ConfirmOnDevice
            title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
            deviceModelInternal={getDeviceInternalModel(device)}
            deviceUnitColor={getDeviceColorVariant(device)}
        />
        <Modal.ModalBase
            heading={<Translation id="TR_CHECK_FINGERPRINT" />}
            data-testid="@suite/modal/confirm-fingerprint-on-device"
            size="tiny"
        >
            <Card>
                <Fingerprint device={device} />
            </Card>
        </Modal.ModalBase>
    </Modal.Backdrop>
);
