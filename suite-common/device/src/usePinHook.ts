import { useEffect, useState } from 'react';

import { type ButtonRequest } from '@suite-common/suite-types';
import TrezorConnect, { UI_EVENTS, UI_RESPONSE } from '@trezor/connect';

const NEW_PIN_REQUEST_TYPES = ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'];
const NEW_WIPE_CODE_REQUEST_TYPES = [
    'PinMatrixRequestType_WipeCodeFirst',
    'PinMatrixRequestType_WipeCodeSecond',
];

export const usePin = (buttonRequests: ButtonRequest[], requestId?: string) => {
    const [pin, setPin] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const pinRequestType = buttonRequests[buttonRequests.length - 1];
    const isSettingNewWipeCode =
        pinRequestType?.code && NEW_WIPE_CODE_REQUEST_TYPES.includes(pinRequestType?.code);
    const isSettingNewPin =
        pinRequestType?.code && NEW_PIN_REQUEST_TYPES.includes(pinRequestType.code);

    const cancel = () =>
        isSettingNewWipeCode
            ? TrezorConnect.cancel({ reason: 'wipe-cancelled' })
            : TrezorConnect.cancel({ reason: 'pin-cancelled' });

    const handlePinSubmit = () => {
        setSubmitted(true);
        TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_PIN, payload: pin, requestId });
        setPin('');
    };

    useEffect(() => {
        setSubmitted(false);
    }, [buttonRequests.length]);

    const invalidPinAttempts = buttonRequests.filter(r => r.code === UI_EVENTS.PIN_INVALID).length;

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
