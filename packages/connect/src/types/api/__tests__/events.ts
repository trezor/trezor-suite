import {
    TrezorConnect,
    UI_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    BLOCKCHAIN,
    TRANSPORT,
    UI,
    AccountInfo,
    Address,
} from '../../..';

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
        const { payload } = event;
        payload.path.toLowerCase();
        if (payload.type === 'acquired') {
            payload.mode.toLowerCase();
            payload.firmware.toLowerCase();
            payload.status.toLowerCase();

            // features
            payload.features.vendor.toLowerCase();
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
        if (event.type === TRANSPORT.START) {
            event.payload.type as string;
            // event.payload.version;
            // event.payload.outdated;
        }
        if (event.type === TRANSPORT.ERROR) {
            event.payload.bridge?.changelog.toLowerCase();
        }
    });
    api.off(TRANSPORT_EVENT, () => {});
    api.removeAllListeners(TRANSPORT_EVENT);
    api.removeAllListeners('TRANSPORT_EVENT');
    api.on('transport-start', payload => {
        payload.type as string;
    });
    api.off('transport-start', () => {});

    api.on(UI_EVENT, event => {
        if (event.type === UI.BUNDLE_PROGRESS) {
            // event.payload.progress;
            // event.payload.error;
            // event.payload.response;
        }
        if (event.type === UI.REQUEST_BUTTON) {
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
            event.payload.data?.address.toLowerCase();
            event.payload.device.label.toLowerCase();
        }

        if (event.type === UI.REQUEST_PIN) {
            if (event.payload.type === 'PinMatrixRequestType_Current') {
                //
            }
            // @ts-expect-error
            if (event.payload.type === 'foo') {
                //
            }
        }

        if (event.type === UI.REQUEST_WORD) {
            if (event.payload.type === 'WordRequestType_Plain') {
                //
            }
        }
    });
    api.off(UI_EVENT, () => {});

    // event without payload
    api.on(UI.REQUEST_UI_WINDOW, () => {});
    // @ts-expect-error enforce no payload
    api.on(UI.REQUEST_UI_WINDOW, _payload => {});

    api.on<AccountInfo | null>(UI.BUNDLE_PROGRESS, event => {
        event.progress as number;
        event.error?.toLowerCase();
        if (event.response?.empty === false) {
            event.response.availableBalance.toLowerCase();
        }
    });

    api.on<Address>(UI.BUNDLE_PROGRESS, event => {
        event.progress as number;
        event.error?.toLowerCase();
        event.response.serializedPath.toLowerCase();
        event.response.address.toLowerCase();
    });
    api.off(UI.BUNDLE_PROGRESS, () => {});
    api.removeAllListeners(UI.BUNDLE_PROGRESS);

    api.on(UI.REQUEST_BUTTON, event => {
        // @ts-expect-error
        if (event.code === 'a') {
            //
        }
    });
    api.off(UI.REQUEST_BUTTON, () => {});
    api.removeAllListeners(UI.BUNDLE_PROGRESS);

    api.on(BLOCKCHAIN_EVENT, event => {
        if (event.type === BLOCKCHAIN.CONNECT) {
            if (event.payload.testnet) {
                event.payload.blockHash.toLowerCase();
                event.payload.shortcut.toLowerCase();
            }
        }
        if (event.type === BLOCKCHAIN.BLOCK) {
            event.payload.blockHash.toLowerCase();
            event.payload.blockHeight as number;
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

    api.on(BLOCKCHAIN.FIAT_RATES_UPDATE, payload => {
        payload.rates.usd?.toFixed();
    });
};
