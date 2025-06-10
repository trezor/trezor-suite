import { Modal } from '@trezor/components';
import { ConfirmOnDevice } from '@trezor/product-components';

import { PinMatrix, Translation } from 'src/components/suite';
import { usePin } from 'src/hooks/suite/usePinModal';
import { TrezorDevice } from 'src/types/suite';

type PinModalProps = {
    device: TrezorDevice;
};

export const PinModal = ({ device }: PinModalProps) => {
    const {
        isSettingNewPin,
        isSettingNewWipeCode,
        hasInvalidAttempts,
        onCancel,
        handlePinSubmit,
        setPin,
        pin,
        submitted,
    } = usePin();
    if (!device.features) return null;

    const getHeading = () => {
        const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];

        switch (pinRequestType?.code) {
            case 'PinMatrixRequestType_NewFirst':
                return 'TR_ENTER_NEW_PIN';
            case 'PinMatrixRequestType_NewSecond':
                return 'TR_RE_ENTER_NEW_PIN';
            case 'PinMatrixRequestType_WipeCodeFirst':
                return 'TR_ENTER_WIPECODE';
            case 'PinMatrixRequestType_WipeCodeSecond':
                return 'TR_RE_ENTER_WIPECODE';
            default:
                return 'TR_ENTER_PIN';
        }
    };

    return (
        <Modal.Backdrop>
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                onCancel={onCancel}
            />
            <Modal.ModalBase
                heading={<Translation id={getHeading()} />}
                onCancel={onCancel}
                data-testid="@modal/pin"
                size="tiny"
                bottomContent={
                    <>
                        <Modal.Button
                            onClick={handlePinSubmit}
                            data-testid="@pin/submit-button"
                            isDisabled={submitted}
                        >
                            <Translation id="TR_CONFIRM" />
                        </Modal.Button>
                        <Modal.Button onClick={onCancel} variant="tertiary">
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
            >
                <PinMatrix
                    pin={pin}
                    setPin={setPin}
                    onSubmit={handlePinSubmit}
                    // show explanation when either setting a new pin or wipe code or entering existing pin but has at least one invalid attempt
                    showExplanation={isSettingNewPin || isSettingNewWipeCode || hasInvalidAttempts}
                    isDisabled={submitted}
                />
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
