import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { WindowWindowChannel } from '@trezor/connect-common/src/messageChannel/window-window';
import { getWeakRandomId } from '@trezor/utils/src/getWeakRandomId';

import { Popup } from './abstract';
import { getIframeInstance } from './iframe';

export class WebPopup extends Popup {
    private popupWindow: Window | undefined;
    private iframe = getIframeInstance();
    private channelId = getWeakRandomId(16);

    protected createChannel(origin: string): AbstractMessageChannel<CoreEventMessage> {
        return new WindowWindowChannel<CoreEventMessage>({
            windowHere: window,
            windowPeer: () => this.iframe.get()?.contentWindow || undefined,
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-popup',
            },
            logger: this.logger,
            origin,
        });
    }

    protected async open(): Promise<void> {
        const url = this.buildPopupUrl(this.popupSrc);
        // const url0 = 'http://0.0.0.0:8000/connect-popup';
        // const url1 =
        //     'https://dev.suite.sldev.cz/suite-web/feat/connect-web-iframe-2/web/connect-popup';

        const query = `connect-popup-req=${this.channelId}`;
        const iframeUrl = `${url}/iframe.html?${query}&debug=1`;
        const popupUrl = `${url}/iframe.html?${query}&debug=1`;

        const windowResult = window.open(popupUrl, 'modal');

        if (!windowResult) {
            this.handleOpenFailure('Popup window blocked by browser');

            return Promise.resolve();
        }

        this.popupWindow = windowResult;
        const popupWindowChannel = new WindowWindowChannel<CoreEventMessage>({
            windowHere: window,
            windowPeer: () => windowResult,
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-bootstrap',
            },
            logger: this.logger,
            origin,
        });

        const popupWindowChannelPromise = popupWindowChannel.init();

        try {
            await this.iframe.create(iframeUrl);
        } catch (error) {
            this.handleOpenFailure('iframe creation error: ' + error.message);

            return Promise.resolve();
        }

        const iframeWindowChannel = new WindowWindowChannel<CoreEventMessage>({
            windowHere: window,
            windowPeer: () => this.iframe.get()?.contentWindow || undefined,
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-bootstrap',
            },
            logger: this.logger,
            origin,
        });

        const iframeWindowChannelPromise = iframeWindowChannel.init();

        await Promise.allSettled([popupWindowChannelPromise, iframeWindowChannelPromise]).then(
            results => {
                const popupHandshake = results[0];
                const iframeHandshake = results[1];

                if (popupHandshake.status === 'rejected' && iframeHandshake.status === 'rejected') {
                    this.handleOpenFailure(
                        'Both popup and iframe handshakes failed: ' +
                            popupHandshake.reason +
                            ', ' +
                            iframeHandshake.reason,
                    );
                } else if (popupHandshake.status === 'rejected') {
                    this.handleOpenFailure('Popup handshake failed: ' + popupHandshake.reason);
                } else if (iframeHandshake.status === 'rejected') {
                    this.handleOpenFailure('Iframe handshake failed: ' + iframeHandshake.reason);
                }
            },
        );

        if (!this.channel.isConnected) {
            this.channel.connect();
        }

        this.startCloseMonitoring();

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
