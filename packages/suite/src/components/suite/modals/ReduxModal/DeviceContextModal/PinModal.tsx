import { type TranslationKey } from '@suite/intl';
import { selectModalRequestId } from '@suite/modal';
import { usePin } from '@suite-common/device';

import { useSelector } from 'src/hooks/suite';
import { type TrezorDevice } from 'src/types/suite';

import { PinModalView } from './PinModalView';

type PinModalProps = {
    device: TrezorDevice;
};

const getHeadingId = (device: TrezorDevice): TranslationKey => {
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

export const PinModal = ({ device }: PinModalProps) => {
    const requestId = useSelector(selectModalRequestId);
    const {
        isSettingNewPin,
        isSettingNewWipeCode,
        hasInvalidAttempts,
        onCancel,
        handlePinSubmit,
        setPin,
        pin,
        submitted,
    } = usePin(device.buttonRequests, requestId);
    if (!device.features) return null;

    return (
        <PinModalView
            device={device}
            pin={pin}
            setPin={setPin}
            onSubmit={handlePinSubmit}
            onCancel={onCancel}
            headingId={getHeadingId(device)}
            submitted={submitted}
            showExplanation={isSettingNewPin || isSettingNewWipeCode || hasInvalidAttempts}
        />
    );
};
