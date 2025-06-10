import { useEffect, useState } from 'react';

import { ButtonRequest } from '@suite-common/suite-types';
import { selectDeviceButtonRequests } from '@suite-common/wallet-core';
import TrezorConnect, { UI } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

const NEW_PIN_REQUEST_TYPES = ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'];
const NEW_WIPE_CODE_REQUEST_TYPES = [
    'PinMatrixRequestType_WipeCodeFirst',
    'PinMatrixRequestType_WipeCodeSecond',
];

const usePinWithoutSelector = (buttonRequests: Pick<ButtonRequest, 'code'>[]) => {
    const [pin, setPin] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const pinRequestType = buttonRequests[buttonRequests.length - 1];
    const isSettingNewWipeCode =
        pinRequestType?.code && NEW_WIPE_CODE_REQUEST_TYPES.includes(pinRequestType?.code);
    const isSettingNewPin =
        pinRequestType?.code && NEW_PIN_REQUEST_TYPES.includes(pinRequestType.code);

    const cancel = () => isSettingNewWipeCode
            ? TrezorConnect.cancel('wipe-cancelled')
            : TrezorConnect.cancel('pin-cancelled');

    const handlePinSubmit = () => {
        setSubmitted(true);
        TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
        setPin('');
    };

    useEffect(() => {
        setSubmitted(false);
    }, [buttonRequests.length]);

    const invalidPinAttempts = buttonRequests.filter(r => r.code === UI.INVALID_PIN).length;

    return {
        isSettingNewWipeCode,
        isSettingNewPin,
        hasInvalidAttempts: invalidPinAttempts > 0,
        pin,
        setPin,
        handlePinSubmit,
        onCancel: cancel,
        submitted,
    };
};

export const usePin = () => usePinWithoutSelector(useSelector(selectDeviceButtonRequests));
