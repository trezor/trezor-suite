import { Device, UI_REQUEST } from '@trezor/connect';

import { State } from '../types';
import { ErrorViewProps } from '../views/Error';
import { PassphraseEventProps } from '../views/Passphrase';
import { TransportEventProps } from '../views/Transport';

export type ConnectUIEventProps =
    // connect-core events
    | TransportEventProps
    | PassphraseEventProps
    | ErrorViewProps
    | { type: typeof UI_REQUEST.DEVICE_NEEDS_BACKUP; device: Device }
    | { type: typeof UI_REQUEST.FIRMWARE_OUTDATED; device: Device }
    // connect-popup events
    | { type: 'phishing-domain' }
    | { type: 'connect-ui-rendered' }
    | { type: 'state-update'; payload: State }
    | { type: 'loading'; message?: string };

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
