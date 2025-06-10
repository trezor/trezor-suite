import { useState } from 'react';

import { ButtonRequest } from '@suite-common/suite-types';
import { selectDeviceButtonRequests } from '@suite-common/wallet-core';
import TrezorConnect, { UI } from '@trezor/connect';

import { onPinSubmit } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

const NEW_PIN_REQUEST_TYPES = ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'];
const NEW_WIPE_CODE_REQUEST_TYPES = [
    'PinMatrixRequestType_WipeCodeFirst',
    'PinMatrixRequestType_WipeCodeSecond',
];

const usePinWithoutSelector = (buttonRequests: Pick<ButtonRequest, 'code'>[]) => {
    const dispatch = useDispatch();

    const [pin, setPin] = useState('');

    const pinRequestType = buttonRequests[buttonRequests.length - 1];
    const isSettingNewWipeCode =
        pinRequestType?.code && NEW_WIPE_CODE_REQUEST_TYPES.includes(pinRequestType?.code);
    const isSettingNewPin =
        pinRequestType?.code && NEW_PIN_REQUEST_TYPES.includes(pinRequestType.code);

    const onCancel = () =>
        isSettingNewWipeCode
            ? TrezorConnect.cancel('wipe-cancelled')
            : TrezorConnect.cancel('pin-cancelled');

    const handlePinSubmit = () => {
        dispatch(onPinSubmit(pin));
        setPin('');
    };

    return {
        isSettingNewWipeCode,
        isSettingNewPin,
        hasInvalidAttempts: buttonRequests.filter(r => r.code === UI.INVALID_PIN).length > 0,
        pin,
        setPin,
        handlePinSubmit,
        onCancel,
    };
};

export const usePin = () => usePinWithoutSelector(useSelector(selectDeviceButtonRequests));
