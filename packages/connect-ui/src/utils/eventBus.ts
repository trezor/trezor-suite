import { PopupHandshake, UI_REQUEST, Device, PopupMethodInfo } from '@trezor/connect';

import { TransportEventProps } from '../views/Transport';
import { PassphraseEventProps } from '../views/Passphrase';
import { ErrorViewProps } from '../views/Error';

export type ConnectUIEventProps =
    // connect-core events
    | TransportEventProps
    | PassphraseEventProps
    | ErrorViewProps
    | PopupHandshake
    | PopupMethodInfo
    | { type: typeof UI_REQUEST.DEVICE_NEEDS_BACKUP; device: Device }
    | { type: typeof UI_REQUEST.FIRMWARE_OUTDATED; device: Device }
    // connect-popup events
    | { type: 'phishing-domain' }
    | { type: 'connect-ui-rendered' }
    | { type: 'waiting-for-iframe-handshake' }
    | { type: 'waiting-for-iframe-init' };

const reactChannel = 'react';

export const reactEventBus = {
    on(callback: (detail: ConnectUIEventProps) => void) {
        document.addEventListener(reactChannel, (e: Event) => {
            const detail = (e as CustomEvent).detail as ConnectUIEventProps;

            callback(detail);
        });
    },
    remove(callback: (detail: ConnectUIEventProps) => void) {
        document.removeEventListener(reactChannel, (e: Event) => {
            const detail = (e as CustomEvent).detail as ConnectUIEventProps;

            callback(detail);
        });
    },
    dispatch(data?: ConnectUIEventProps) {
        const event = new CustomEvent(reactChannel, data ? { detail: data } : undefined);

        document.dispatchEvent(event);
    },
};
