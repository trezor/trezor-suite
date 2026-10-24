import { WEBEXTENSION_SUITE_WEB_CHANNEL } from '@trezor/connect-common';
import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { ServiceWorkerWindowExtConnectableChannel } from '@trezor/connect-common/src/messageChannel/serviceworker-window-ext-connectable';
import { type Deferred, createDeferred } from '@trezor/utils';

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
                here: WEBEXTENSION_SUITE_WEB_CHANNEL.webextension,
                peer: WEBEXTENSION_SUITE_WEB_CHANNEL.suiteWeb,
            },
            currentId: () => this.popupWindowPromise?.promise.then(tab => tab.id),
            logger: this.logger,
            allowedOrigin: origin,
        });
    }

    // open() resolves before the chrome callbacks run, so a second call can
    // reset() and open() again in the meantime. Each callback therefore checks
    // that its own popupWindowPromise is still the current one; otherwise it
    // would fail or take over the newer open().
    private isSuperseded(popupWindowPromise: Deferred<chrome.tabs.Tab>): boolean {
        return popupWindowPromise !== this.popupWindowPromise;
    }

    protected open(): Promise<void> {
        const popupWindowPromise = createDeferred<chrome.tabs.Tab>();
        this.popupWindowPromise = popupWindowPromise;
        // Prevent unhandled rejection when open fails (e.g. popup blocked).
        // The rejection is surfaced to callers via handleOpenFailure → handshakePromise.
        popupWindowPromise.promise.catch(() => {});
        const url = this.buildPopupUrl(this.popupSrc);

        chrome.windows.getCurrent(currentWindow => {
            if (this.isSuperseded(popupWindowPromise)) return;

            this.logger.debug('opening popup. currentWindow type:', currentWindow.type);
            if (currentWindow.type !== 'normal') {
                this.openPopupInNewWindow(url, popupWindowPromise);
            } else {
                this.openPopupInNewTab(url, popupWindowPromise);
            }
        });

        if (!this.channel.isConnected) {
            this.channel.connect();
            this.channel.init().catch(error => {
                this.logger.error('Channel handshake failed:', error);
            });
        }

        return Promise.resolve();
    }

    private openPopupInNewWindow(url: string, popupWindowPromise: Deferred<chrome.tabs.Tab>): void {
        chrome.windows.create({ url }, newWindow => {
            if (!newWindow) {
                this.onPopupOpenFailed('Failed to create popup window', popupWindowPromise);

                return;
            }
            chrome.tabs.query({ windowId: newWindow.id, active: true }, tabs => {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const tab: chrome.tabs.Tab = tabs[0];
                this.onPopupTabResolved(tab, popupWindowPromise);
            });
        });
    }

    private openPopupInNewTab(url: string, popupWindowPromise: Deferred<chrome.tabs.Tab>): void {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
            if (this.isSuperseded(popupWindowPromise)) return;

            if (!tabs[0]?.id) {
                this.onPopupOpenFailed('No active tab found', popupWindowPromise);

                return;
            }
            this.extensionTabId = tabs[0].id;
            chrome.tabs.create({ url, index: tabs[0].index + 1 }, tab =>
                this.onPopupTabResolved(tab, popupWindowPromise),
            );
        });
    }

    private onPopupOpenFailed(reason: string, popupWindowPromise: Deferred<chrome.tabs.Tab>): void {
        if (this.isSuperseded(popupWindowPromise)) {
            this.logger.debug('Ignoring failure of a superseded popup open:', reason);

            return;
        }

        popupWindowPromise.reject(new Error(reason));
        this.handleOpenFailure(reason);
    }

    private onPopupTabResolved(
        tab: chrome.tabs.Tab,
        popupWindowPromise: Deferred<chrome.tabs.Tab>,
    ): void {
        if (this.isSuperseded(popupWindowPromise)) {
            // The newer open() has its own tab; this one would only linger.
            this.logger.debug('closing popup tab of a superseded open:', tab?.id);
            if (tab?.id) {
                chrome.tabs.remove(tab.id, () => {
                    this.logChromeError('close', chrome.runtime.lastError);
                });
            }

            return;
        }

        this.popupWindow = tab;
        this.logger.debug('popup tab resolved:', tab.id);
        popupWindowPromise.resolve(tab);
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
