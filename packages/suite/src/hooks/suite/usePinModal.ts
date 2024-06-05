import { ButtonRequest } from '@suite-common/suite-types';
import { selectDeviceButtonRequests } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';

const NEW_PIN_REQUEST_TYPES = ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'];
const NEW_WIPE_CODE_REQUEST_TYPES = [
    'PinMatrixRequestType_WipeCodeFirst',
    'PinMatrixRequestType_WipeCodeSecond',
];

export const usePinWithoutSelector = (buttonRequests: Pick<ButtonRequest, 'code'>[]) => {
    const pinRequestType = buttonRequests[buttonRequests.length - 1];
    const invalidCounter = buttonRequests.filter(r => r.code === 'ui-invalid_pin').length || 0;

    const isWipeCode =
        pinRequestType?.code && NEW_WIPE_CODE_REQUEST_TYPES.includes(pinRequestType?.code);
    const isRequestingNewPinCode =
        pinRequestType?.code && NEW_PIN_REQUEST_TYPES.includes(pinRequestType.code);
    const isPinInvalid = invalidCounter > 0;
    const isModalExtended = isRequestingNewPinCode || isPinInvalid;

    return {
        isWipeCode,
        isRequestingNewPinCode,
        isPinInvalid,
        isModalExtended,
    };
};

export const usePin = () => {
    return usePinWithoutSelector(useSelector(selectDeviceButtonRequests));
};
