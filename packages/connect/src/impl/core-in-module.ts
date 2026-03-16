import { ERRORS } from '@trezor/connect-common/src/constants';
import { ConnectEmitter } from '@trezor/connect-common/src/types/emitter';
import { cloneObject, createDeferredManager } from '@trezor/utils';

import { initCoreState } from '../core';
import { parseConnectSettings } from '../data/connectSettings';
import type {
    CallMethodPayload,
    CoreEventMessage,
    CoreRequestMessage,
    MethodResponseMessage,
    UiResponseEvent,
} from '../events';
import {
    BLOCKCHAIN_EVENT,
    CORE_CALL,
    DEVICE_EVENT,
    POPUP,
    RESPONSE_EVENT,
    TRANSPORT,
    TRANSPORT_EVENT,
    UI_EVENT,
    createErrorMessage,
} from '../events';
import type { ConnectFactoryDependencies } from '../factory';
import type { ConnectSettings, ConnectSettingsPublic, ConnectSettingsTransport } from '../types';
import type { UpdateConnectSettings } from '../types/api/updateConnectSettings';
import { initLog } from '../utils/debug';

export abstract class CoreInModule implements ConnectFactoryDependencies<ConnectSettingsPublic> {
    public readonly eventEmitter = new ConnectEmitter();

    private settings;
    private coreManager;
    private log;
    private messagePromises;

    private readonly boundOnCoreEvent = this.onCoreEvent.bind(this);

    protected abstract get defaultTransports(): ConnectSettingsTransport[];

    public constructor() {
        this.settings = parseConnectSettings();
        this.log = initLog('@trezor/connect');
        this.coreManager = initCoreState();
        this.messagePromises = createDeferredManager<Omit<MethodResponseMessage, 'event' | 'type'>>(
            { initialId: 1 },
        );
    }

    // handle messages to core
    public handleCoreMessage(message: CoreRequestMessage) {
        const core = this.coreManager.get();
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
                const { id = 0, success, device } = message;
                const resolved = this.messagePromises.resolve(
                    id,
                    success
                        ? { id, success, payload: message.payload, device }
                        : { id, success, error: message.error, device },
                );
                if (!resolved) this.log.warn(`Unknown message id ${id}`);
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
                this.log.warn('Undefined message', event, message);
        }
    }

    public async init(settings: Partial<ConnectSettings>) {
        if (this.coreManager.get() || this.coreManager.getPending()) {
            throw ERRORS.TypedError('Init_AlreadyInitialized');
        }

        this.settings = parseConnectSettings({ ...this.settings, ...settings });

        if (!this.settings.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        if (!this.settings.transports?.length) {
            this.settings.transports = this.defaultTransports;
        }

        this.log.enabled = !!this.settings.debug;

        await this.coreManager.getOrInit(this.settings, this.boundOnCoreEvent);
    }

    protected abstract updateProxy(proxy: UpdateConnectSettings['proxy']): Promise<void>;

    public async updateConnectSettings(params: UpdateConnectSettings) {
        const { proxy, transports: newTransports } = params;

        try {
            await this.updateProxy(proxy);
        } catch (err) {
            return Promise.resolve(createErrorMessage(err));
        }

        if (newTransports !== undefined) {
            const transports = newTransports?.length ? newTransports : this.defaultTransports;

            this.settings = parseConnectSettings({ ...this.settings, transports });
            this.handleCoreMessage({ type: TRANSPORT.SET_TRANSPORTS, payload: { transports } });
        }

        return { success: true as const, payload: { message: 'success' } } as const;
    }

    public async call(params: CallMethodPayload) {
        try {
            if (!this.settings.manifest) {
                throw ERRORS.TypedError('Init_ManifestMissing');
            }

            // If init() is in progress but hasn't completed yet, wait for it.
            if (!this.coreManager.get()) {
                const pending = this.coreManager.getPending();
                if (pending) {
                    await pending;
                }
            }

            const { promiseId, promise } = this.messagePromises.create();
            const payload = cloneObject<any>(params);
            this.handleCoreMessage({ type: CORE_CALL, id: promiseId, payload });
            const response = cloneObject(await promise);

            return response ?? createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
        } catch (error) {
            this.log.error('call', error);

            return createErrorMessage(error);
        }
    }

    public uiResponse(response: UiResponseEvent) {
        this.handleCoreMessage(response);
    }

    public cancel(error?: string) {
        this.handleCoreMessage({ type: POPUP.CLOSED, payload: error ? { error } : null });
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        this.settings = parseConnectSettings();

        // Only dispose coreManager if initialization has completed.
        // If init is still pending (getPending() is truthy), disposing would reject
        // the pending promise and cause an unhandled rejection in the init() caller.
        if (this.coreManager.get()) {
            this.coreManager.dispose();
        }
    }
}
