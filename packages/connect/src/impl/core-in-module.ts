import { ERRORS } from '@trezor/connect-common/src/constants';
import { DeferredManager, cloneObject, createDeferredManager } from '@trezor/utils';

import { parseConnectSettings } from '../data/connectSettings';
import {
    BLOCKCHAIN_EVENT,
    CORE_CALL,
    CallMethodPayload,
    CoreEventMessage,
    CoreRequestMessage,
    DEVICE_EVENT,
    MethodResponseMessage,
    POPUP,
    RESPONSE_EVENT,
    TRANSPORT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UiResponseEvent,
    createErrorMessage,
} from '../events';
import { ConnectFactoryDependencies } from '../factory';
import type { ConnectSettings, ConnectSettingsPublic, Manifest } from '../types';
import type { UpdateConnectSettings } from '../types/api/updateConnectSettings';
import { ConnectEmitter } from '../types/emitter';
import { Log, initLog } from '../utils/debug';

export class CoreInModule implements ConnectFactoryDependencies<ConnectSettingsPublic> {
    public eventEmitter = new ConnectEmitter();
    public _settings: ConnectSettings;

    private _coreManager?: any;
    private _log: Log;
    private _messagePromises: DeferredManager<Omit<MethodResponseMessage, 'event' | 'type'>>;

    private readonly boundOnCoreEvent = this.onCoreEvent.bind(this);

    public constructor() {
        this._settings = parseConnectSettings();
        this._log = initLog('@trezor/connect-web');
        this._messagePromises = createDeferredManager({ initialId: 1 });
    }

    private async initCoreManager() {
        const importResult = await import('@trezor/connect/src/core/index').catch(_err => {
            this._log.error(`_err: Cannot load connect core`, _err);
        });

        if (!importResult) {
            this._log.error(`importResult is empty! Cannot load connect core`);
            throw new Error(`importResult is empty! Cannot load connect core`);
        }

        const { initCoreState } = importResult;

        if (!initCoreState) return;

        this._coreManager = initCoreState();

        return this._coreManager;
    }

    public manifest(data: Manifest) {
        this._settings = parseConnectSettings({
            ...this._settings,
            manifest: data,
        });
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        this._settings = parseConnectSettings();
        if (this._coreManager) {
            this._coreManager.dispose();
        }
        this._coreManager = undefined;

        return Promise.resolve(undefined);
    }

    public cancel(error?: string) {
        if (this._coreManager) {
            const core = this._coreManager.get();
            if (!core) {
                throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
            }

            this.handleCoreMessage({
                type: POPUP.CLOSED,
                payload: error ? { error } : null,
            });
        }
    }

    // handle messages to core
    public handleCoreMessage(message: CoreRequestMessage) {
        const core = this._coreManager.get();
        if (!core) {
            throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
        }
        core.handleMessage(message);
    }

    // handle message received from Core
    private onCoreEvent(rawMessage: CoreEventMessage) {
        const message = cloneObject(rawMessage);

        const { event, type, payload } = message;

        switch (event) {
            case RESPONSE_EVENT: {
                const { id = 0, success, error, device } = message;
                const resolved = this._messagePromises.resolve(id, {
                    id,
                    success,
                    payload,
                    error,
                    device,
                });
                if (!resolved) this._log.warn(`Unknown message id ${id}`);
                break;
            }
            case DEVICE_EVENT:
                // pass DEVICE event up to html
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
                break;

            case TRANSPORT_EVENT:
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload);
                break;

            case BLOCKCHAIN_EVENT:
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload);
                break;

            case UI_EVENT:
                // pass UI event up
                this.eventEmitter.emit(event, message);
                this.eventEmitter.emit(type, payload);
                break;

            default:
                this._log.warn('Undefined message', event, message);
        }
    }

    public async init(settings: Partial<ConnectSettings> = {}) {
        if (this._coreManager && (this._coreManager.get() || this._coreManager.getPending())) {
            throw ERRORS.TypedError('Init_AlreadyInitialized');
        }

        this._settings = parseConnectSettings({ ...this._settings, ...settings });

        if (!this._settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        this._settings.lazyLoad = true;

        // defaults for connect-web
        if (!this._settings.transports?.length) {
            this._settings.transports = ['BridgeTransport', 'WebUsbTransport'];
        }

        if (!this._coreManager) {
            this._coreManager = await this.initCoreManager();
            await this._coreManager.getOrInit(this._settings, this.boundOnCoreEvent);
        }

        this._log.enabled = !!this._settings.debug;
    }

    public updateConnectSettings(params: UpdateConnectSettings) {
        const { proxy, transports } = params;

        if (proxy !== undefined) {
            return Promise.resolve(
                createErrorMessage(
                    ERRORS.TypedError(
                        'Method_InvalidPackage',
                        'proxy setting is not supported in web environment',
                    ),
                ),
            );
        }

        if (transports !== undefined) {
            let newTransports = transports;
            if (!transports?.length) {
                newTransports = ['BridgeTransport', 'WebUsbTransport'];
            }
            this._settings = parseConnectSettings({ ...this._settings, transports: newTransports });
            this.handleCoreMessage({
                type: TRANSPORT.SET_TRANSPORTS,
                payload: { transports: newTransports },
            });
        }

        return Promise.resolve({
            success: true as const,
            payload: { message: 'success' },
        } as const);
    }

    public async call(params: CallMethodPayload) {
        if (!this._coreManager) {
            try {
                await this.init();
            } catch (err) {
                return createErrorMessage(err);
            }
        }
        try {
            const { promiseId, promise } = this._messagePromises.create();
            const payload = cloneObject<any>(params);
            this.handleCoreMessage({
                type: CORE_CALL,
                id: promiseId,
                payload,
            });
            const response = cloneObject(await promise);

            return response ?? createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
        } catch (error) {
            this._log.error('call', error);

            return createErrorMessage(error);
        }
    }

    public uiResponse(response: UiResponseEvent) {
        const core = this._coreManager.get();
        if (!core) {
            throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
        }
        this.handleCoreMessage(response);
    }
}
