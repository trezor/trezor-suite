import { useEffect, useState } from 'react';

import { ButtonRequest } from '@suite-common/suite-types';
import TrezorConnect, { UI } from '@trezor/connect';

const NEW_PIN_REQUEST_TYPES = ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'];
const NEW_WIPE_CODE_REQUEST_TYPES = [
    'PinMatrixRequestType_WipeCodeFirst',
    'PinMatrixRequestType_WipeCodeSecond',
];

export const usePin = (buttonRequests: ButtonRequest[]) => {
    const [pin, setPin] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [hasDepletedAllPinAttempts, setHasDepletedAllPinAttempts] = useState(false);

    const pinRequestType = buttonRequests[buttonRequests.length - 1];
    const isSettingNewWipeCode =
        pinRequestType?.code && NEW_WIPE_CODE_REQUEST_TYPES.includes(pinRequestType?.code);
    const isSettingNewPin =
        pinRequestType?.code && NEW_PIN_REQUEST_TYPES.includes(pinRequestType.code);

    const cancel = () =>
        isSettingNewWipeCode
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

    useEffect(() => {
        // we can't really rely on device.buttonRequests since they are flushed away quite often.
        const handler = () => {
            setHasDepletedAllPinAttempts(true);
        };
        TrezorConnect.on(UI.INVALID_PIN_ATTEMPTS_DEPLETED, handler);
        return () => {
            TrezorConnect.off(UI.INVALID_PIN_ATTEMPTS_DEPLETED, handler);
        };
    }, []);

    const invalidPinAttempts = buttonRequests.filter(r => r.code === UI.INVALID_PIN).length;

    return {
        isSettingNewWipeCode,
        isSettingNewPin,
        hasInvalidAttempts: invalidPinAttempts > 0,
        hasDepletedAllPinAttempts,
        pin,
        setPin,
        handlePinSubmit,
        onCancel: cancel,
        submitted,
    };
};
