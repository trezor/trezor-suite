import { useEffect, useState } from 'react';

import { type ButtonRequest } from '@suite-common/suite-types';
import TrezorConnect, { UI_EVENTS, UI_RESPONSE } from '@trezor/connect';

const NEW_PIN_REQUEST_TYPES: ButtonRequest['code'][] = [
    'PinMatrixRequestType_NewFirst',
    'PinMatrixRequestType_NewSecond',
];
const NEW_WIPE_CODE_REQUEST_TYPES: ButtonRequest['code'][] = [
    'PinMatrixRequestType_WipeCodeFirst',
    'PinMatrixRequestType_WipeCodeSecond',
];

export const usePin = (buttonRequests: ButtonRequest[], requestId?: string) => {
    const [pin, setPin] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const pinRequestCode = buttonRequests[buttonRequests.length - 1]?.code;
    const isSettingNewWipeCode =
        pinRequestCode && NEW_WIPE_CODE_REQUEST_TYPES.includes(pinRequestCode);
    const isSettingNewPin = pinRequestCode && NEW_PIN_REQUEST_TYPES.includes(pinRequestCode);

    const cancel = () =>
        isSettingNewWipeCode
            ? TrezorConnect.cancel({ reason: 'wipe-cancelled' })
            : TrezorConnect.cancel({ reason: 'pin-cancelled' });

    const handlePinSubmit = () => {
        setSubmitted(true);
        TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_PIN, payload: pin, requestId });
        setPin('');
    };

    // A new PIN request may come from a device other than the selected one, whose button requests
    // are not in `buttonRequests`.
    useEffect(() => {
        setSubmitted(false);
    }, [buttonRequests.length, requestId]);

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
