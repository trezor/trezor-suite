import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { WindowWindowChannel } from '@trezor/connect-common/src/messageChannel/window-window';

import { Popup } from './abstract';
import { getIframe, getIframeInstance } from './iframe';

export class WebPopup extends Popup {
    private popupWindow: Window | undefined;
    private iframe = getIframeInstance();

    protected createChannel(origin: string): AbstractMessageChannel<CoreEventMessage> {
        return new WindowWindowChannel<CoreEventMessage>({
            windowHere: window,
            windowPeer: () => getIframe().contentWindow || undefined,
            // windowPeer1: () => ({
            //     postMessage: (msg: any) => this.iframe.postMessage(msg),
            //     // postMessage: (msg: any) => {
            //     //     console.warn('WebPopup: postMessage called on popup window', this.foo);
            //     //     this.popupWindow.postMessage(msg);
            //     // },
            // }),
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-popup',
            },
            logger: this.logger,
            origin,
        });
    }

    protected async open() {
        const url = this.buildPopupUrl(this.popupSrc);

        const windowResult = window.open(url, 'modal');

        console.warn('Popup open result', url, windowResult);

        if (!windowResult) {
            this.handleOpenFailure('Popup window blocked by browser');

            return;
        }

        this.popupWindow = windowResult;

        await this.iframe.create(this.popupSrc + '/iframe.html').catch(error => {
            this.logger.error('Failed to create iframe', error);
        });

        if (!this.channel.isConnected) {
            this.channel.connect();
        }

        this.startCloseMonitoring();
    }

    // protected handleCoreMessage(message: CoreEventMessage): Promise<void> {
    //     // await initIframe({ popupSrc: this.popupSrc, extension: false });

    //     return super.handleCoreMessage(message);
    // }

    protected focusPopup(): void {
        this.popupWindow?.focus();
    }

    protected closePopup(): void {
        this.popupWindow?.close();
        this.popupWindow = undefined;
    }

    protected isOpen(): Promise<boolean> {
        console.warn('WebPopup.isOpen()', this.popupWindow);

        return Promise.resolve(this.popupWindow !== undefined); // && !this.popupWindow.closed
    }

    protected onReset(): void {}
}
