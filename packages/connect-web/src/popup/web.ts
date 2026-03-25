import { type CoreEventMessage } from '@trezor/connect/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { WindowWindowChannel } from '@trezor/connect-common/src/messageChannel/window-window';

import { Popup } from './abstract';
import { showErrorModal } from '../ui/showErrorModal';

export class WebPopup extends Popup {
    private popupWindow: Window | undefined;
    private removeErrorModal: (() => void) | undefined;

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

    protected open(): void {
        const url = this.buildPopupUrl(this.popupSrc);

        if (!this.tryOpenPopup(url)) {
            if (this.allowUI) {
                this.showPopupBlockedModal(url);
            } else {
                this.handleOpenFailure('Popup window blocked by browser');
            }
        }
    }

    /**
     * Attempt to open the popup window and wire up the channel.
     * @returns `true` when the popup was successfully opened.
     */
    private tryOpenPopup(url: string): boolean {
        const windowResult = window.open(url, 'modal');

        if (!windowResult) {
            return false;
        }

        this.popupWindow = windowResult;

        if (!this.channel.isConnected) {
            this.channel.connect();
        }

        this.startCloseMonitoring();

        return true;
    }

    /**
     * Display an error overlay on the caller's page when the browser blocks
     * the popup window.  The overlay offers a "Try again" button so the user
     * can retry (the click counts as a user-gesture, which most browsers
     * require for `window.open`).
     */
    private showPopupBlockedModal(url: string): void {
        this.removeErrorModal = showErrorModal(
            'Popup window was blocked by your browser. Please click the button below to try again.',
            {
                onRetry: () => {
                    this.removeErrorModal = undefined;

                    if (!this.tryOpenPopup(url)) {
                        this.showPopupBlockedModal(url);
                    }
                },
                onCancel: () => {
                    this.removeErrorModal = undefined;
                    this.handleOpenFailure('Popup window blocked by browser');
                },
            },
        );
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

    protected onReset(): void {
        this.removeErrorModal?.();
        this.removeErrorModal = undefined;
    }
}
