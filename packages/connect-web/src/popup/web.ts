import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { WindowWindowChannel } from '@trezor/connect-common/src/messageChannel/window-window';

import { Popup } from './abstract';

export class WebPopup extends Popup {
    private popupWindow: Window | undefined;

    protected createChannel(origin: string): AbstractMessageChannel<CoreEventMessage> {
        return new WindowWindowChannel<CoreEventMessage>({
            windowHere: window,
            windowPeer: () => this.popupWindow,
            channel: {
                here: '@trezor/connect-web',
                peer: '@trezor/connect-popup',
            },
            logger: this.logger,
            origin,
        });
    }

    protected open(): Promise<void> {
        const url = this.buildPopupUrl(this.popupSrc);

        const windowResult = window.open(url, 'modal');

        if (!windowResult) {
            this.handleOpenFailure('Popup window blocked by browser');

            return Promise.resolve();
        }

        this.popupWindow = windowResult;

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
        return Promise.resolve(this.popupWindow !== undefined && !this.popupWindow.closed);
    }

    protected onReset(): void {}
}
