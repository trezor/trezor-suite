import EventEmitter from 'events';

import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type CoreEventMessage, POPUP } from '@trezor/connect-common/src/events';
import {
    type AbstractMessageChannel,
    type Message,
} from '@trezor/connect-common/src/messageChannel/abstract';
import type { Manifest, PermissionRequest } from '@trezor/connect-common/src/types';
import { getOrigin } from '@trezor/connect-common/src/utils/urlUtils';
import { type Log } from '@trezor/logger';
import type { IntervalId } from '@trezor/type-utils';
import { type Deferred, createDeferred } from '@trezor/utils';

export type Params = {
    manifest: Manifest;
    popupSrc: string;
    version: string;
    logger: Log;
    requestedPermissions?: PermissionRequest[];
};

// How often to check if popup window is still open (ms).
const POPUP_CLOSE_INTERVAL = 500;

// Every opened popup is a session with its own handshake, from opening until the popup closes or
// fails to open. Closing settles only the handshake of the session it ends, so a late failure of
// a previous popup cannot reject the handshake of the next one, and a close is reported once.
type PopupState = { status: 'closed' } | { status: 'open'; handshake: Deferred<void> };

/**
 * Abstract base for opening the suite-web popup window.
 * Subclasses implement platform-specific behavior for web and webextension environments.
 */
export abstract class Popup extends EventEmitter {
    public channel: AbstractMessageChannel<CoreEventMessage>;
    protected logger: Log;
    protected readonly popupSrc: Params['popupSrc'];

    private readonly manifest: Params['manifest'];
    private readonly version: Params['version'];
    private readonly requestedPermissions: Params['requestedPermissions'];
    private closeInterval: IntervalId | undefined;
    private state: PopupState = { status: 'closed' };
    private pendingFocusOrCreate: Promise<void> = Promise.resolve();

    constructor({ popupSrc, manifest, version, logger, requestedPermissions }: Params) {
        super();
        this.logger = logger;
        this.popupSrc = popupSrc;
        this.manifest = manifest;
        this.version = version;
        this.requestedPermissions = requestedPermissions;
        this.channel = this.createChannel(getOrigin(popupSrc));
        this.channel.on('message', this.handleCoreMessage.bind(this));
    }

    protected abstract createChannel(origin: string): AbstractMessageChannel<CoreEventMessage>;
    protected abstract open(): Promise<void>;
    protected abstract closePopup(): void;
    protected abstract isOpen(): Promise<boolean>;
    protected abstract onReset(focus: boolean): void;

    /**
     * Handshake of the currently open popup, resolved once its core is loaded.
     */
    public get handshakePromise(): Deferred<void> | undefined {
        return this.state.status === 'open' ? this.state.handshake : undefined;
    }

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
        if (!isOpen && this.state.status === 'open') {
            this.reset(false);
        }

        if (this.state.status === 'open') {
            this.focusPopup();

            return;
        }

        // Close existing popup in error state so we can open a fresh one.
        if (isOpen) {
            await this.close();
        }

        const handshake = createDeferred();
        // Prevent unhandled rejection when the promise is rejected before
        // call() attaches its own handler (e.g. popup blocked scenario).
        handshake.promise.catch(() => {});
        this.state = { status: 'open', handshake };

        return this.open();
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
                payload: {
                    manifest: this.manifest,
                    version: this.version,
                    requestedPermissions: this.requestedPermissions,
                },
            });
            this.handshakePromise?.resolve();
        } else if (message.type === POPUP.CLOSED) {
            await this.close();
            this.handlePopupClosed();
        }
    }

    private handlePopupClosed() {
        // The close monitor and POPUP.CLOSED may race each other, only the first one closes.
        if (this.state.status !== 'open') return;

        this.emitClosed();
        this.reset();
    }

    private reset(focus = true) {
        if (this.state.status !== 'open') return;

        const { handshake } = this.state;
        this.state = { status: 'closed' };
        handshake.reject(ERRORS.TypedError('Method_Interrupted'));
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
        // The failure may be reported more than once, e.g. by a bootstrap error message and
        // by the aborted bootstrap handshake. The first report already closed the popup.
        if (this.state.status !== 'open') return;

        this.channel.abortHandshake(reason);
        this.state.handshake.reject(new Error(reason));
        this.handlePopupClosed();
    }

    public async close() {
        if (!(await this.isOpen())) return;

        this.logger.debug('closing popup');
        this.closePopup();
        this.channel.clear();
    }

    private emitClosed() {
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
