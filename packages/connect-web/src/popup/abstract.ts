import EventEmitter from 'events';

import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type CoreEventMessage, DEVICE_EVENT, POPUP } from '@trezor/connect-common/src/events';
import {
    type AbstractMessageChannel,
    type Message,
} from '@trezor/connect-common/src/messageChannel/abstract';
import type { ConnectSettings } from '@trezor/connect-common/src/types';
import { type Log } from '@trezor/connect-common/src/utils/debug';
import { getOrigin } from '@trezor/connect-common/src/utils/urlUtils';
import type { IntervalId } from '@trezor/type-utils';
import { type Deferred, createDeferred } from '@trezor/utils';

export type Params = Pick<ConnectSettings, 'manifest' | 'popupSrc' | 'version'> & {
    logger: Log;
};

// How often to check if popup window is still open (ms).
const POPUP_CLOSE_INTERVAL = 500;

/**
 * Abstract base for opening the suite-web popup window.
 * Subclasses implement platform-specific behavior for web and webextension environments.
 */
export abstract class Popup extends EventEmitter {
    public channel: AbstractMessageChannel<CoreEventMessage>;
    public handshakePromise: Deferred<void> | undefined;
    protected logger: Log;
    protected readonly popupSrc: Params['popupSrc'];

    private readonly manifest: Params['manifest'];
    private readonly version: Params['version'];
    private closeInterval: IntervalId | undefined;
    private locked = false;
    private closedEmitted = false;
    private pendingFocusOrCreate: Promise<void> = Promise.resolve();

    constructor({ popupSrc, manifest, version, logger }: Params) {
        super();
        this.logger = logger;
        this.popupSrc = popupSrc;
        this.manifest = manifest;
        this.version = version;
        this.channel = this.createChannel(getOrigin(popupSrc));
        this.handshakePromise = createDeferred();
        // Prevent unhandled rejection when the promise is rejected before
        // call() attaches its own handler (e.g. popup blocked scenario).
        this.handshakePromise.promise.catch(() => {});
        this.channel.on('message', this.handleCoreMessage.bind(this));
    }

    protected abstract createChannel(origin: string): AbstractMessageChannel<CoreEventMessage>;
    protected abstract open(): void;
    protected abstract closePopup(): void;
    protected abstract isOpen(): Promise<boolean>;
    protected abstract onReset(focus: boolean): void;

    /**
     * focus existing or open — serialized so concurrent calls don't interleave
     */
    async focusOrCreate() {
        this.pendingFocusOrCreate = this.pendingFocusOrCreate
            .catch(() => {})
            .then(() => this._focusOrCreate());

        await this.pendingFocusOrCreate;
    }

    private async _focusOrCreate() {
        const isOpen = await this.isOpen();

        // Clean up stale state only if we previously had a popup that is now gone.
        if (!isOpen && this.locked) {
            this.reset(false);
        }

        if (this.locked) {
            this.focusPopup();

            return;
        }

        // Close existing popup in error state so we can open a fresh one.
        if (isOpen) {
            await this.close();
        }

        this.locked = true;
        this.closedEmitted = false;

        this.open();
    }

    protected buildPopupUrl(src: string): string {
        return src;
    }

    protected focusPopup(): void {
        // No-op by default; overridden in subclasses.
    }

    protected startCloseMonitoring(): void {
        this.closeInterval = setInterval(async () => {
            if (!(await this.isOpen())) {
                this.handlePopupClosed();
            }
        }, POPUP_CLOSE_INTERVAL);
    }

    private async handleCoreMessage(message: Message<CoreEventMessage>) {
        this.logger.debug('handleCoreMessage', message);
        if (message.type === POPUP.CORE_LOADED) {
            this.channel.postMessage({
                type: POPUP.HANDSHAKE,
                // in this case, settings will be validated in popup
                payload: { manifest: this.manifest, version: this.version },
            });
            this.handshakePromise?.resolve();
        } else if (message.type === POPUP.CLOSED) {
            await this.close();
            this.handlePopupClosed();
        } else if (message.event === DEVICE_EVENT) {
            this.emit(DEVICE_EVENT, message);
        }
    }

    private handlePopupClosed() {
        this.emitClosed();
        this.reset();
    }

    private reset(focus = true) {
        // Guard against double reset. Without this, a second reset() would reject
        // the freshly-created handshakePromise (unhandled rejection). This can
        // happen when e.g. close monitor and POPUP.CLOSED race each other.
        if (!this.locked) return;

        this.locked = false;
        this.handshakePromise?.reject(ERRORS.TypedError('Method_Interrupted'));
        this.handshakePromise = createDeferred();
        this.handshakePromise.promise.catch(() => {});
        // Reject any pending channel-level handshake so that callers
        // awaiting channel.init() don't hang forever.  Without this,
        // disconnect() → clear() drops the handshakeFinished reference
        // without settling the promise.
        this.channel.abortHandshake('Popup closed');
        this.channel.disconnect();

        if (this.closeInterval) {
            clearInterval(this.closeInterval);
            this.closeInterval = undefined;
        }

        this.onReset(focus);
    }

    /**
     * Called when open() fails (e.g. popup blocked by browser).
     * Rejects pending promises so callers get an error instead of hanging forever.
     */
    protected handleOpenFailure(reason: string): void {
        this.logger.error('Failed to open popup:', reason);
        const error = new Error(reason);
        this.channel.abortHandshake(reason);
        this.handshakePromise?.reject(error);
        this.handlePopupClosed();
    }

    public async close() {
        if (!(await this.isOpen())) return;

        this.logger.debug('closing popup');
        this.closePopup();
        this.channel.clear();
    }

    private emitClosed() {
        if (this.closedEmitted) return;
        this.closedEmitted = true;

        // When popup is closed we should create a not-real response as if the request was interrupted.
        // Because when popup closes and TrezorConnect is living there it cannot respond, but we know
        // it was interrupted so we safely fake it.
        this.channel.resolveMessagePromises({
            success: false,
            error: ERRORS.TypedError('Method_Interrupted'),
        });
        this.emit(POPUP.CLOSED);
    }
}
