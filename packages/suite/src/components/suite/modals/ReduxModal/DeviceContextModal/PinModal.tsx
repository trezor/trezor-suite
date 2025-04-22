import { useState } from 'react';

import { Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';

import { onPinSubmit } from 'src/actions/suite/modalActions';
import { PinMatrix, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { usePin } from 'src/hooks/suite/usePinModal';
import { TrezorDevice } from 'src/types/suite';

type PinModalProps = {
    device: TrezorDevice;
};

export const PinModal = ({ device }: PinModalProps) => {
    const dispatch = useDispatch();
    const { isRequestingNewPinCode, isWipeCode } = usePin();
    const [pin, setPin] = useState('');

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

    const onCancel = () =>
        isWipeCode ? TrezorConnect.cancel('wipe-cancelled') : TrezorConnect.cancel('pin-cancelled');

    const handlePinSubmit = () => {
        dispatch(onPinSubmit(pin));
        setPin('');
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
                        <Modal.Button onClick={handlePinSubmit} data-testid="@pin/submit-button">
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
                    showExplanation={isRequestingNewPinCode || isWipeCode}
                />
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
