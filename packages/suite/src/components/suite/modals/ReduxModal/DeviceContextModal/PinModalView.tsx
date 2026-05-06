import { Translation, type TranslationKey } from '@suite/intl';
import { Modal } from '@trezor/components';
import { ConfirmOnDevicePill } from '@trezor/product-components';

import { PinMatrix } from 'src/components/suite/PinMatrix/PinMatrix';
import type { TrezorDevice } from 'src/types/suite';

interface PinModalViewProps {
    device: TrezorDevice;
    pin: string;
    setPin: (pin: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    headingId?: TranslationKey;
    submitted?: boolean;
    showExplanation?: boolean;
}

export const PinModalView = ({
    device,
    pin,
    setPin,
    onSubmit,
    onCancel,
    headingId = 'TR_ENTER_PIN',
    submitted = false,
    showExplanation = false,
}: PinModalViewProps) => (
    <Modal.Backdrop>
        <ConfirmOnDevicePill
            title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
            deviceModelInternal={device.features?.internal_model}
            deviceUnitColor={device.features?.unit_color}
            onCancel={onCancel}
        />
        <Modal.ModalBase
            heading={<Translation id={headingId} />}
            onCancel={onCancel}
            data-testid="@modal/pin"
            width={400}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={onSubmit}
                        data-testid="@pin/submit-button"
                        isDisabled={submitted}
                        flex="1"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} intent="neutral" priority="secondary" flex="1">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <PinMatrix
                pin={pin}
                setPin={setPin}
                onSubmit={onSubmit}
                showExplanation={showExplanation}
                isDisabled={submitted}
            />
        </Modal.ModalBase>
    </Modal.Backdrop>
);
