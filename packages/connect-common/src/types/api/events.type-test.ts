import { ThpPairingMethod } from '@trezor/protocol';

import type { TrezorConnectPrivilegedAPI as TrezorConnect } from '../../index';
import {
    BLOCKCHAIN,
    BLOCKCHAIN_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_EVENTS,
    UI_REQUEST,
    UI_REQUESTS,
    UI_RESPONSE,
} from '../../index';

export const events = (api: TrezorConnect) => {
    api.on(DEVICE_EVENT, event => {
        event.type.toLowerCase();
        if (event.type === 'button') {
            const { payload } = event;
            payload.device.type.toLowerCase();
            payload.code?.toLowerCase();
            payload.pages?.toFixed();

            return;
        }
        if (event.type === 'device-firmware_version_changed') {
            const { payload } = event;
            payload.oldVersion.join('.');
            payload.newVersion.join('.');

            return;
        }
        if (event.type === 'device-thp_credentials_changed') {
            const { payload } = event;
            payload.credentials.credential.toLowerCase();
            payload.credentials.trezor_static_public_key.toLowerCase();
            payload.credentials.host_static_key.toLowerCase();
            if (payload.credentials.autoconnect === true) {
                //
            }

            return;
        }
        if (event.type === 'device-trezor_push_notification') {
            return;
        }
        if (event.type === 'device-thp_pairing_status_changed') {
            const { payload } = event;
            if (payload.status === 'invalid-tag') {
                payload.tag.toLowerCase();
            }
            if (payload.status === 'failed') {
                payload.message.toLowerCase();
            }

            return;
        }
        const { payload } = event;
        payload.path.toLowerCase();
        if (payload.type === 'acquired') {
            payload.mode.toLowerCase();
            payload.firmware.toLowerCase();
            payload.status.toLowerCase();

            // features
            payload.features.vendor?.toLowerCase();
            // @ts-expect-error: error does not exist
            payload.error.toLowerCase();
        }

        if (payload.type === 'unreadable') {
            // error field is accessible only in unreadable device
            payload.error.toLowerCase();
        }
    });
    api.off(DEVICE_EVENT, () => {});
    api.removeAllListeners();
    api.removeAllListeners(DEVICE_EVENT);
    api.removeAllListeners('DEVICE_EVENT');

    // @ts-expect-error
    api.on('UNKNOWN-EVENT', () => {});
    // @ts-expect-error
    api.off('UNKNOWN-EVENT', () => {});
    // @ts-expect-error
    api.removeAllListeners('UNKNOWN-EVENT');

    api.on(TRANSPORT_EVENT, event => {
        if (event.type === 'transport-start') {
            // event.payload.type as string;
            // event.payload.version;
            // event.payload.outdated;
        }
    });
    api.off(TRANSPORT_EVENT, () => {});
    api.removeAllListeners(TRANSPORT_EVENT);
    api.removeAllListeners('TRANSPORT_EVENT');
    api.on('transport-start', () => {
        // payload.type as string;
    });
    api.off('transport-start', () => {});

    api.on(UI_EVENT, event => {
        if (event.type === UI_EVENTS.BUNDLE_PROGRESS) {
            // event.payload.progress;
            // event.error.message;
            // event.payload.response;
        }
        if (event.type === UI_EVENTS.BUTTON_REQUEST) {
            if (event.payload.code === 'ButtonRequest_ConfirmOutput') {
                //
            }
            if (event.payload.code === 'ButtonRequest_FirmwareUpdate') {
                //
            }
            // @ts-expect-error
            if (event.payload.code === 'foo') {
                //
            }
            if (event.payload.data?.type === 'address') {
                event.payload.data.address.toLowerCase();
            }
            if (event.payload.data?.type === 'message') {
                event.payload.data.message.toLowerCase();
            }
            event.payload.device.label.toLowerCase();
        }
    });

    api.on(UI_REQUEST, event => {
        if (event.type === UI_REQUESTS.REQUEST_PIN) {
            if (event.payload.type === 'PinMatrixRequestType_Current') {
                //
            }
            // @ts-expect-error
            if (event.payload.type === 'foo') {
                //
            }
        }

        if (event.type === UI_REQUESTS.REQUEST_WORD) {
            if (event.payload.type === 'WordRequestType_Plain') {
                //
            }
        }

        if (event.type === UI_REQUESTS.REQUEST_THP_PAIRING_TAG) {
            if (event.payload.device.thp?.properties?.pairing_methods[0] === 'CodeEntry') {
                api.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    payload: { selectedMethod: ThpPairingMethod.NFC },
                });

                api.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    payload: { selectedMethod: 'SkipPairing' },
                });

                api.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    // @ts-expect-error invalid string
                    payload: { selectedMethod: 'unknown method' },
                });

                api.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    // @ts-expect-error invalid enum
                    payload: { selectedMethod: 7 },
                });

                api.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    payload: { tag: '0000' },
                });

                api.uiResponse({
                    type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
                    // @ts-expect-error invalid tag
                    payload: { tag: 1234 },
                });
            }
        }
    });
    api.off(UI_EVENT, () => {});

    // event without payload
    api.on(UI_EVENTS.BUTTON_REQUEST, () => {});
    api.on(UI_EVENTS.BUTTON_REQUEST, _payload => {});

    api.on(UI_EVENTS.BUNDLE_PROGRESS, event => {
        // event.progress as number;
        event.error?.toLowerCase();
        if (event.response?.empty === false) {
            event.response.availableBalance.toLowerCase();
        }
    });

    api.on(UI_EVENTS.BUNDLE_PROGRESS, event => {
        // event.progress as number;
        event.error?.toLowerCase();
        event.response.serializedPath.toLowerCase();
        event.response.address.toLowerCase();
    });
    api.off(UI_EVENTS.BUNDLE_PROGRESS, () => {});
    api.removeAllListeners(UI_EVENTS.BUNDLE_PROGRESS);

    api.on(UI_EVENTS.BUTTON_REQUEST, event => {
        // @ts-expect-error
        if (event.code === 'a') {
            //
        }
    });
    api.off(UI_EVENTS.BUTTON_REQUEST, () => {});
    api.removeAllListeners(UI_EVENTS.BUNDLE_PROGRESS);

    api.on(BLOCKCHAIN_EVENT, event => {
        if (event.type === BLOCKCHAIN.CONNECT) {
            if (event.payload.testnet) {
                event.payload.blockHash.toLowerCase();
                event.payload.shortcut.toLowerCase();
            }
        }
        if (event.type === BLOCKCHAIN.BLOCK) {
            event.payload.blockHash.toLowerCase();
            // event.payload.blockHeight as number;
        }
        if (event.type === BLOCKCHAIN.NOTIFICATION) {
            event.payload.notification.descriptor.toLowerCase();
            event.payload.notification.tx.targets.map(t => (t.isAddress ? t.amount : t.n));
        }
    });
    api.off(BLOCKCHAIN_EVENT, () => {});

    api.on(BLOCKCHAIN.CONNECT, payload => {
        payload.blockHash.toLowerCase();
        payload.shortcut.toLowerCase();
    });

    // @ts-expect-error callback payload must match the selected event
    api.on(BLOCKCHAIN.CONNECT, (_payload: string) => {});

    api.on(BLOCKCHAIN.FIAT_RATES_UPDATE, payload => {
        payload.rates.usd?.toFixed();
    });
};
