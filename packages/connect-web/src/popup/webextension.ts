import { CoreEventMessage } from '@trezor/connect/src/events';
import { AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { ServiceWorkerWindowExtConnectableChannel } from '@trezor/connect-common/src/messageChannel/serviceworker-window-ext-connectable';
import { createDeferred } from '@trezor/utils';

import { Popup } from './abstract';

export class WebExtensionPopup extends Popup {
    private popupWindow?: chrome.tabs.Tab;
    private popupWindowPromise = createDeferred<chrome.tabs.Tab>();
    private extensionTabId = 0;

    /**
     * Append extension ID via hash so the popup can identify the calling extension.
     */
    protected override buildPopupUrl(src: string): string {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
            const hashParams = new URLSearchParams();
            hashParams.set('extension-id', chrome.runtime.id);

            return src + '#' + hashParams.toString();
        }

        return src;
    }

    /**
     * Check if a tab exists (helper for lifecycle checks).
     */
    private checkIfTabExists(tabId: number): Promise<boolean> {
        return new Promise(resolve => {
            chrome.tabs.get(tabId, () => {
                resolve(!chrome.runtime.lastError);
            });
        });
    }

    private logChromeError(operation: string, error?: chrome.runtime.LastError): void {
        if (error) {
            this.logger.error(`Chrome ${operation} error:`, error);
        }
    }

    protected createChannel(origin: string): AbstractMessageChannel<CoreEventMessage> {
        return new ServiceWorkerWindowExtConnectableChannel<CoreEventMessage>({
            channel: {
                here: '@trezor/connect-webextension-externally-connectable',
                peer: '@trezor/suite-web',
            },
            currentId: () => this.popupWindowPromise?.promise.then(tab => tab.id),
            logger: this.logger,
            allowedOrigin: origin,
        });
    }

    protected open(): void {
        this.popupWindowPromise = createDeferred<chrome.tabs.Tab>();
        // Prevent unhandled rejection when open fails (e.g. popup blocked).
        // The rejection is surfaced to callers via handleOpenFailure → handshakePromise.
        this.popupWindowPromise.promise.catch(() => {});
        const url = this.buildPopupUrl(this.popupSrc);

        chrome.windows.getCurrent(currentWindow => {
            this.logger.debug('opening popup. currentWindow type:', currentWindow.type);
            if (currentWindow.type !== 'normal') {
                this.openPopupInNewWindow(url);
            } else {
                this.openPopupInNewTab(url);
            }
        });

        if (!this.channel.isConnected) {
            this.channel.connect();
            this.channel.init().catch(error => {
                this.logger.error('Channel handshake failed:', error);
            });
        }
    }

    private openPopupInNewWindow(url: string): void {
        chrome.windows.create({ url }, newWindow => {
            if (!newWindow) {
                this.popupWindowPromise?.reject(new Error('Failed to create popup window'));
                this.handleOpenFailure('Failed to create popup window');

                return;
            }
            chrome.tabs.query({ windowId: newWindow.id, active: true }, tabs =>
                this.onPopupTabResolved(tabs[0]),
            );
        });
    }

    private openPopupInNewTab(url: string): void {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
            if (!tabs[0]?.id) {
                this.popupWindowPromise?.reject(new Error('No active tab found'));
                this.handleOpenFailure('No active tab found');

                return;
            }
            this.extensionTabId = tabs[0].id;
            chrome.tabs.create({ url, index: tabs[0].index + 1 }, tab =>
                this.onPopupTabResolved(tab),
            );
        });
    }

    private onPopupTabResolved(tab: chrome.tabs.Tab): void {
        this.popupWindow = tab;
        this.logger.debug('popup tab resolved:', tab.id);
        this.popupWindowPromise?.resolve(tab);
        this.startCloseMonitoring();
    }

    protected focusPopup(): void {
        if (this.popupWindow?.id) {
            chrome.tabs.update(this.popupWindow.id, { active: true });
        }
    }

    protected closePopup(): void {
        const tabId = this.popupWindow?.id;
        if (!tabId) return;

        chrome.tabs.remove(tabId, () => {
            this.logChromeError('close', chrome.runtime.lastError);
        });
        this.popupWindow = undefined;
    }

    protected isOpen(): Promise<boolean> {
        if (!this.popupWindow?.id) return Promise.resolve(false);

        return this.checkIfTabExists(this.popupWindow.id);
    }

    protected onReset(focus = true): void {
        if (!focus || !this.extensionTabId) return;

        this.logger.debug('Focusing back to extension tab:', this.extensionTabId);
        chrome.tabs.update(this.extensionTabId, { active: true }, () => {
            this.logChromeError('focus', chrome.runtime.lastError);
        });
        this.extensionTabId = 0;
    }
}
