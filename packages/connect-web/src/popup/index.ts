// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/PopupManager.js

import EventEmitter from 'events';
import { createDeferred, Deferred } from '@trezor/utils';
import { POPUP, IFRAME, UI, CoreEventMessage, IFrameLoaded } from '@trezor/connect/lib/events';
import type { ConnectSettings } from '@trezor/connect/lib/types';
import { getOrigin } from '@trezor/connect/lib/utils/urlUtils';
import { showPopupRequest } from './showPopupRequest';
import { Log } from '@trezor/connect/lib/utils/debug';

import { ServiceWorkerWindowChannel } from '../channels/serviceworker-window';
import {
    AbstractMessageChannel,
    Message,
} from '@trezor/connect-common/src/messageChannel/abstract';
import { WindowWindowChannel } from '../channels/window-window';

// Util
const checkIfTabExists = (tabId: number | undefined) =>
    new Promise(resolve => {
        if (!tabId) return resolve(false);
        function callback() {
            if (chrome.runtime.lastError) {
                resolve(false);
            } else {
                // Tab exists
                resolve(true);
            }
        }
        chrome.tabs.get(tabId, callback);
    });

// Event `POPUP_REQUEST_TIMEOUT` is used to close Popup window when there was no handshake from iframe.
const POPUP_REQUEST_TIMEOUT = 850;
const POPUP_CLOSE_INTERVAL = 500;
const POPUP_OPEN_TIMEOUT = 3000;

export class PopupManager extends EventEmitter {
    popupWindow:
        | { mode: 'tab'; tab: chrome.tabs.Tab }
        | { mode: 'window'; window: Window }
        | undefined;

    settings: ConnectSettings;

    origin: string;

    locked = false;

    channel: AbstractMessageChannel<CoreEventMessage>;

    channelIframe?: AbstractMessageChannel<CoreEventMessage>;

    handshakePromise: Deferred<void> | undefined;

    iframeHandshakePromise: Deferred<IFrameLoaded['payload']> | undefined;

    popupPromise: Deferred<void> | undefined;

    requestTimeout: ReturnType<typeof setTimeout> | undefined;

    openTimeout: ReturnType<typeof setTimeout> | undefined;

    closeInterval: ReturnType<typeof setInterval> | undefined;

    extensionTabId = 0;

    logger: Log;

    constructor(settings: ConnectSettings, { logger }: { logger: Log }) {
        super();
        this.settings = settings;
        this.origin = getOrigin(settings.popupSrc);
        this.logger = logger;

        if (this.settings.env === 'webextension') {
            this.channel = new ServiceWorkerWindowChannel<CoreEventMessage>({
                name: 'trezor-connect',
                channel: {
                    here: '@trezor/connect-webextension',
                    peer: '@trezor/connect-content-script',
                },
                logger,
                currentId: () => {
                    if (this.popupWindow?.mode === 'tab') return this.popupWindow?.tab.id;
                },
                legacyMode: !this.settings.useCoreInPopup,
            });
        } else {
            this.channel = new WindowWindowChannel<CoreEventMessage>({
                windowHere: window,
                windowPeer: () => {
                    if (this.popupWindow?.mode === 'window') return this.popupWindow?.window;
                },
                channel: {
                    here: '@trezor/connect-web',
                    peer: '@trezor/connect-popup',
                },
                logger,
                origin: this.origin,
            });
        }

        if (!this.settings.useCoreInPopup) {
            // If not in core, we need to create a channel for the iframe
            this.iframeHandshakePromise = createDeferred(IFRAME.LOADED);
            this.channelIframe = new WindowWindowChannel<CoreEventMessage>({
                windowHere: window,
                windowPeer: () => window,
                channel: {
                    here: '@trezor/connect-web',
                    peer: '@trezor/connect-iframe',
                },
                logger,
                origin: this.origin,
            });
            this.channelIframe?.on('message', this.handleMessage.bind(this));
        }

        if (this.settings.useCoreInPopup) {
            // Core mode
            this.handshakePromise = createDeferred();
            this.channel.on('message', this.handleCoreMessage.bind(this));
        } else if (this.settings.env === 'webextension') {
            // Webextension iframe
            this.channel.on('message', this.handleExtensionMessage.bind(this));
        } else {
            // Web
            this.channel.on('message', this.handleMessage.bind(this));
        }
        this.channel.init();
    }

    async request() {
        // popup request

        // check if current popup window is still open
        if (this.settings.useCoreInPopup && this.popupWindow?.mode === 'tab') {
            const currentPopupExists = await checkIfTabExists(this.popupWindow?.tab?.id);
            if (!currentPopupExists) {
                this.clear();
            }
        }

        // bring popup window to front
        if (this.locked) {
            if (this.popupWindow?.mode === 'tab' && this.popupWindow.tab.id) {
                chrome.tabs.update(this.popupWindow.tab.id, { active: true });
            } else if (this.popupWindow?.mode === 'window') {
                this.popupWindow.window.focus();
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

        const timeout = this.settings.env === 'webextension' ? 1 : POPUP_REQUEST_TIMEOUT;
        this.requestTimeout = setTimeout(() => {
            this.requestTimeout = undefined;
            openFn();
        }, timeout);
    }

    unlock() {
        this.locked = false;
    }

    open() {
        const src = this.settings.popupSrc;

        if (this.settings.useCoreInPopup) {
            // Timeout not used in Core mode, we can't run showPopupRequest with no DOM
            this.openWrapper(src);

            return;
        }

        this.popupPromise = createDeferred(POPUP.LOADED);
        this.openWrapper(src);

        this.closeInterval = setInterval(() => {
            if (!this.popupWindow) return;
            if (this.popupWindow.mode === 'tab' && this.popupWindow.tab.id) {
                chrome.tabs.get(this.popupWindow.tab.id, tab => {
                    if (!tab) {
                        // If no reference to popup window, it was closed by user or by this.close() method.
                        this.emit(POPUP.CLOSED);
                        this.clear();
                    }
                });
            } else if (this.popupWindow.mode === 'window' && this.popupWindow.window.closed) {
                this.clear();
                this.emit(POPUP.CLOSED);
            }
        }, POPUP_CLOSE_INTERVAL);

        // open timeout will be cancelled by POPUP.BOOTSTRAP message
        this.openTimeout = setTimeout(() => {
            this.clear();
            showPopupRequest(this.open.bind(this), () => {
                this.emit(POPUP.CLOSED);
            });
        }, POPUP_OPEN_TIMEOUT);
    }

    openWrapper(url: string) {
        if (this.settings.env === 'webextension') {
            chrome.windows.getCurrent(currentWindow => {
                this.logger.debug('opening popup. currentWindow: ', currentWindow);
                // Request coming from extension popup,
                // create new window above instead of opening new tab
                if (currentWindow.type !== 'normal') {
                    chrome.windows.create({ url }, newWindow => {
                        chrome.tabs.query(
                            {
                                windowId: newWindow?.id,
                                active: true,
                            },
                            tabs => {
                                this.popupWindow = { mode: 'tab', tab: tabs[0] };
                                this.injectContentScript(tabs[0].id!);
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
                                    this.popupWindow = { mode: 'tab', tab };
                                    this.injectContentScript(tab.id!);
                                },
                            );
                        },
                    );
                }
            });
        } else {
            const windowResult = window.open(url, 'modal');
            if (!windowResult) return;
            this.popupWindow = { mode: 'window', window: windowResult };
        }

        if (!this.channel.isConnected) {
            this.channel.connect();
        }
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

    handleCoreMessage(message: Message<CoreEventMessage>) {
        if (message.type === POPUP.CORE_LOADED) {
            this.channel.postMessage({
                type: POPUP.HANDSHAKE,
                // in this case, settings will be validated in popup
                payload: { settings: this.settings },
            });
            this.handshakePromise?.resolve();
        } else if (message.type === POPUP.CLOSED) {
            // When popup is closed we should create a not-real response as if the request was interrupted.
            // Because when popup closes and TrezorConnect is living there it cannot respond, but we know
            // it was interrupted so we safely fake it.
            this.channel.resolveMessagePromises({
                code: 'Method_Interrupted',
                error: POPUP.CLOSED,
            });
        }
    }

    handleExtensionMessage(data: Message<CoreEventMessage>) {
        if (
            data.type === POPUP.ERROR ||
            data.type === POPUP.LOADED ||
            data.type === POPUP.BOOTSTRAP
        ) {
            this.handleMessage(data);
        } else if (data.type === POPUP.EXTENSION_USB_PERMISSIONS) {
            chrome.tabs.query(
                {
                    currentWindow: true,
                    active: true,
                },
                tabs => {
                    chrome.tabs.create(
                        {
                            url: 'trezor-usb-permissions.html',
                            index: tabs[0].index + 1,
                        },
                        _tab => {
                            // do nothing
                        },
                    );
                },
            );
        } else if (data.type === POPUP.CLOSE_WINDOW) {
            this.clear();
        }
    }

    handleMessage(data: Message<CoreEventMessage>) {
        if (data.type === IFRAME.LOADED) {
            this.iframeHandshakePromise?.resolve(data.payload);
        } else if (data.type === POPUP.BOOTSTRAP) {
            // popup is opened properly, now wait for POPUP.LOADED message
            if (this.openTimeout) clearTimeout(this.openTimeout);
        } else if (data.type === POPUP.ERROR && this.popupWindow) {
            // handle popup error
            const errorMessage =
                data.payload && typeof data.payload.error === 'string' ? data.payload.error : null;
            this.emit(POPUP.CLOSED, errorMessage ? `Popup error: ${errorMessage}` : null);
            this.clear();
        } else if (data.type === POPUP.LOADED) {
            // in case of webextension where bootstrap message is not sent
            if (this.openTimeout) clearTimeout(this.openTimeout);
            if (this.popupPromise) {
                this.popupPromise.resolve();
            }
            // popup is successfully loaded
            this.iframeHandshakePromise?.promise.then(payload => {
                // send ConnectSettings to popup
                // note this settings and iframe.ConnectSettings could be different (especially: origin, popup, webusb, debug)
                // now popup is able to load assets
                this.channel.postMessage({
                    type: POPUP.INIT,
                    payload: {
                        ...payload,
                        settings: this.settings,
                    },
                });
            });
        } else if (data.type === POPUP.CANCEL_POPUP_REQUEST || data.type === UI.CLOSE_UI_WINDOW) {
            this.clear(false);
        }
    }

    clear(focus = true) {
        this.locked = false;
        this.popupPromise = undefined;
        this.handshakePromise = createDeferred();

        if (this.channel) {
            this.channel.disconnect();
        }

        if (this.requestTimeout) {
            clearTimeout(this.requestTimeout);
            this.requestTimeout = undefined;
        }
        if (this.openTimeout) {
            clearTimeout(this.openTimeout);
            this.openTimeout = undefined;
        }
        if (this.closeInterval) {
            clearInterval(this.closeInterval);
            this.closeInterval = undefined;
        }

        // switch to previously focused tab

        if (focus && this.extensionTabId) {
            chrome.tabs.update(this.extensionTabId, { active: true });
            this.extensionTabId = 0;
        }
    }

    close() {
        if (!this.popupWindow) return;

        this.logger.debug('closing popup');

        if (this.popupWindow.mode === 'tab') {
            let _e = chrome.runtime.lastError;
            if (this.popupWindow.tab.id) {
                chrome.tabs.remove(this.popupWindow.tab.id, () => {
                    _e = chrome.runtime.lastError;
                    if (_e) {
                        this.logger.error('closed with error', _e);
                    }
                });
            }
        } else if (this.popupWindow.mode === 'window') {
            this.popupWindow.window.close();
        }

        this.popupWindow = undefined;
    }

    async postMessage(message: CoreEventMessage) {
        // NOTE: This method only seems to be used in one case to show UI.IFRAME_FAILURE
        // Maybe we could handle this in a simpler way?

        // device needs interaction but there is no popup/ui
        // maybe popup request wasn't handled
        // ignore "ui_request_window" type
        if (!this.popupWindow && message.type !== UI.REQUEST_UI_WINDOW && this.openTimeout) {
            this.clear();
            showPopupRequest(this.open.bind(this), () => {
                this.emit(POPUP.CLOSED);
            });

            return;
        }

        // post message before popup request finalized
        if (this.popupPromise) {
            await this.popupPromise.promise;
        }
        // post message to popup window
        if (this.popupWindow?.mode === 'window') {
            this.popupWindow.window.postMessage(message, this.origin);
        } else if (this.popupWindow?.mode === 'tab') {
            this.channel.postMessage(message);
        }
    }
}
