// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/PopupManager.js
import EventEmitter from 'events';

import { PopupEventMessage, ConnectSettings } from '@trezor/connect/lib/exports';
import { getOrigin } from '@trezor/connect/lib/utils/urlUtils';
import { Log } from '@trezor/connect/lib/utils/debug';

import { ServiceWorkerWindowChannel } from './channels/serviceworker-window';

export class PopupManager extends EventEmitter {
    popupWindow: chrome.tabs.Tab | undefined;

    settings: ConnectSettings;

    origin: string;

    locked = false;

    channel: ServiceWorkerWindowChannel<PopupEventMessage>;

    extensionTabId = 0;

    logger: Log;

    constructor(settings: ConnectSettings, { logger }: { logger: Log }) {
        super();
        this.settings = settings;
        this.origin = getOrigin(settings.popupSrc);
        this.logger = logger;
        this.channel = new ServiceWorkerWindowChannel<PopupEventMessage>({
            name: 'trezor-connect',
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-content-script',
            },
            logger,
        });
        this.channel.init();
    }

    request() {
        // popup request
        // bring popup window to front
        if (this.locked) {
            if (this.popupWindow?.id) {
                chrome.tabs.update(this.popupWindow.id, { active: true });
            }
            return;
        }

        // When requesting a popup window and there is a reference to popup window and it is not locked
        // we close it so we can open a new one.
        // This is necessary when popup window is in error state and we want to open a new one.
        if (this.popupWindow && !this.locked) {
            this.close();
        }

        const openFn = this.open.bind(this);
        this.locked = true;

        openFn();
    }

    unlock() {
        this.locked = false;
    }

    // create a special content script to be injected into log.html and stop sending logs over popup
    open() {
        const url = `${this.settings.popupSrc}`;
        chrome.windows.getCurrent(currentWindow => {
            this.logger.debug('opening popup. currentWindow: ', currentWindow);

            // Request coming from extension popup,
            // create new window above instead of opening new tab
            if (currentWindow.type !== 'normal') {
                // todo: when is this actually used?
                chrome.windows.create({ url }, newWindow => {
                    chrome.tabs.query(
                        {
                            windowId: newWindow?.id,
                            active: true,
                        },
                        tabs => {
                            // eslint-disable-next-line prefer-destructuring
                            this.popupWindow = tabs[0];
                            this.injectContentScript(this.popupWindow.id!);
                        },
                    );
                });
            } else {
                chrome.tabs.query(
                    {
                        currentWindow: true,
                        active: true,
                    },
                    tabs => {
                        this.extensionTabId = tabs[0].id as number;

                        chrome.tabs.create(
                            {
                                url,
                                index: tabs[0].index + 1,
                            },
                            tab => {
                                this.popupWindow = tab;
                                this.injectContentScript(tab.id!);
                            },
                        );
                    },
                );
            }
        });
    }

    private injectContentScript = (tabId: number) => {
        chrome.permissions.getAll(permissions => {
            if (permissions.permissions?.includes('scripting')) {
                chrome.scripting
                    .executeScript({
                        target: { tabId },
                        // content script is injected into body of func in build time.
                        func: () => {
                            // <!--content-script-->
                        },
                    })
                    .then(() => this.logger.debug('content script injected'))
                    .catch(error => this.logger.error('content script injection error', error));
            } else {
                // When permissions for `scripting` are not provided 3rd party integrations have include content-script.js manually.
            }
        });
    };

    clear(focus = true) {
        this.locked = false;

        if (this.channel) {
            this.channel.disconnect();
        }

        // switch to previously focused tab

        if (focus && this.extensionTabId) {
            chrome.tabs.update(this.extensionTabId, { active: true });
            this.extensionTabId = 0;
        }
    }

    close() {
        if (!this.popupWindow?.id) return;

        this.logger.debug('closing popup', this.popupWindow.id);

        let e = chrome.runtime.lastError;

        chrome.tabs.remove(this.popupWindow.id, () => {
            e = chrome.runtime.lastError;

            if (e) {
                this.logger.error('closed with error', e);
            }
        });
    }
}
