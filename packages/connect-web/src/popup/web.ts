import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { WindowWindowChannel } from '@trezor/connect-common/src/messageChannel/window-window';
import { getOrigin } from '@trezor/connect-common/src/utils/urlUtils';
import { getWeakRandomId } from '@trezor/utils/src/getWeakRandomId';

import { Popup } from './abstract';
import { getIframeInstance } from './iframe';
import { BootstrapError } from '../bootstrap/bootstrap-errors';

export class WebPopup extends Popup {
    private popupWindow: Window | undefined;
    private iframe = getIframeInstance();
    private channelId = getWeakRandomId(16);

    protected createChannel(): AbstractMessageChannel<CoreEventMessage> {
        return new WindowWindowChannel<CoreEventMessage>({
            windowHere: window,
            windowPeer: () => this.iframe.get()?.contentWindow || undefined,
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-popup',
            },
            logger: this.logger,
            origin: getOrigin(this.popupSrc),
        });
    }

    protected async open(): Promise<void> {
        const url = this.buildPopupUrl(this.popupSrc);
        const query = `connect-popup-req=${this.channelId}`;
        const debug = this.logger.enabled ? '&debug=1' : '';
        const popupUrl = `${url}/bootstrap.html?${query}${debug}`;
        const popupOrigin = getOrigin(this.popupSrc);

        const windowResult = window.open('about:blank', '_blank');
        if (!windowResult) {
            const error = ERRORS.TypedError('Handshake_Error', 'popup-blocked');
            this.handleOpenFailure(error.message);

            return Promise.reject(error);
        }

        try {
            await this.iframe.create(popupUrl);
        } catch (error) {
            windowResult.close();
            this.handleOpenFailure(error.message);

            return Promise.reject(error);
        }

        // Open bootstrap.html. From now on we cant control the window.
        // Communication via postMessage is limited to the same origin or localhost.
        windowResult.location.href = popupUrl;

        // TODO: popupWindow assign conditionally when we have limited control over the window.
        // this.popupWindow = windowResult;

        const iframeWindowChannel = new WindowWindowChannel<
            CoreEventMessage | { type: 'channel-handshake-error'; error: string }
        >({
            windowHere: window,
            windowPeer: () => this.iframe.get()?.contentWindow || undefined,
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-bootstrap-iframe',
            },
            logger: this.logger,
            origin: popupOrigin,
        });

        iframeWindowChannel.on('message', message => {
            if (message.type === 'channel-handshake-error') {
                // This works only on limited setups: same origin or localhost.
                // Handled by ../bootstrap.ts popup handshake
                windowResult.postMessage(
                    {
                        type: 'channel-handshake-error',
                        error: message.error,
                    },
                    popupOrigin,
                );

                this.handleOpenFailure(message.error);
                iframeWindowChannel.abortHandshake(message.error);
            }
        });

        try {
            await iframeWindowChannel.init();
            iframeWindowChannel.disconnect();
        } catch (error) {
            this.handleOpenFailure(error.message);
            iframeWindowChannel.disconnect();

            const isBootstrapError = Object.values(BootstrapError).includes(error.message);
            if (isBootstrapError) {
                // transform bootstrap-specific error
                return Promise.reject(ERRORS.TypedError('Handshake_Error', error.message));
            }

            return Promise.reject(error);
        }

        if (!this.channel.isConnected) {
            this.channel.connect();
        }

        // TODO: implement ping-pong this.startCloseMonitoring();

        return Promise.resolve();
    }

    protected focusPopup(): void {
        this.popupWindow?.focus();
    }

    protected closePopup(): void {
        this.popupWindow?.close();
        this.popupWindow = undefined;
    }

    protected isOpen(): Promise<boolean> {
        return Promise.resolve(this.popupWindow !== undefined);
    }

    protected onReset(): void {}
}
