// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/PopupManager.js

import EventEmitter from 'events';
import { createDeferred, Deferred } from '@trezor/utils/lib/createDeferred';
import { POPUP, IFRAME, UI, CoreEventMessage, IFrameLoaded } from '@trezor/connect/lib/events';
import type { ConnectSettings } from '@trezor/connect/lib/types';
import { getOrigin } from '@trezor/connect/lib/utils/urlUtils';
import { showPopupRequest } from './showPopupRequest';

// Event `POPUP_REQUEST_TIMEOUT` is used to close Popup window when there was no handshake from iframe.
const POPUP_REQUEST_TIMEOUT = 850;
const POPUP_CLOSE_INTERVAL = 500;
const POPUP_OPEN_TIMEOUT = 3000;

export class PopupManager extends EventEmitter {
    popupWindow: any;

    settings: ConnectSettings;

    origin: string;

    locked = false;

    requestTimeout = 0;

    openTimeout: ReturnType<typeof setTimeout> | undefined;

    closeInterval = 0;

    iframeHandshake: Deferred<IFrameLoaded['payload']>;

    popupPromise: Deferred<void> | undefined;

    // handleMessage: (event: MessageEvent) => void;

    // handleExtensionConnect: () => void;

    // handleExtensionMessage: () => void;

    extensionPort: chrome.runtime.Port | undefined;

    extensionTabId = 0;

    constructor(settings: ConnectSettings) {
        super();
        this.settings = settings;
        this.origin = getOrigin(settings.popupSrc);
        this.handleMessage = this.handleMessage.bind(this);
        this.iframeHandshake = createDeferred(IFRAME.LOADED);

        if (this.settings.env === 'webextension') {
            this.handleExtensionConnect = this.handleExtensionConnect.bind(this);
            this.handleExtensionMessage = this.handleExtensionMessage.bind(this);

            chrome.runtime.onConnect.addListener(this.handleExtensionConnect);
        }

        window.addEventListener('message', this.handleMessage, false);
    }

    request() {
        // popup request
        // TODO: ie - open immediately and hide it but post handshake after timeout

        // bring popup window to front
        if (this.locked) {
            if (this.popupWindow) {
                if (this.settings.env === 'webextension') {
                    chrome.tabs.update(this.popupWindow.id, { active: true });
                } else {
                    this.popupWindow.focus();
                }
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
        this.requestTimeout = window.setTimeout(() => {
            this.requestTimeout = 0;
            openFn();
        }, timeout);
    }

    unlock() {
        this.locked = false;
    }

    open() {
        const src = this.settings.popupSrc;

        this.popupPromise = createDeferred(POPUP.LOADED);
        this.openWrapper(src);

        this.closeInterval = window.setInterval(() => {
            if (!this.popupWindow) return;
            if (this.settings.env === 'webextension') {
                chrome.tabs.get(this.popupWindow.id, tab => {
                    if (!tab) {
                        // If no reference to popup window, it was closed by user or by this.close() method.
                        this.emit(POPUP.CLOSED);
                        this.clear();
                    }
                });
            } else if (this.popupWindow.closed) {
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
                                this.popupWindow = tabs[0];
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
                                },
                            );
                        },
                    );
                }
            });
        } else if (this.settings.env === 'electron') {
            this.popupWindow = window.open(url, 'modal');
        } else {
            this.popupWindow = window.open('', '_blank');
            if (this.popupWindow) {
                this.popupWindow.location.href = url; // otherwise android/chrome loose window.opener reference
            }
        }
    }

    handleExtensionConnect(port: chrome.runtime.Port) {
        // Ignore port if name does not match
        if (port.name !== 'trezor-connect') return;

        // Ignore port if name does match, but port created not by current popup
        if (!this.popupWindow || (this.popupWindow && this.popupWindow.id !== port.sender?.tab?.id))
            return;

        // since POPUP.BOOTSTRAP will not be handled by "handleMessage" we need to threat "content-script" connection as the same event
        // popup is opened properly, now wait for POPUP.LOADED message (in this case handled by "handleExtensionMessage")
        if (this.openTimeout) clearTimeout(this.openTimeout);

        this.extensionPort = port;

        this.extensionPort.onMessage.addListener(this.handleExtensionMessage);
    }

    handleExtensionMessage(message: MessageEvent) {
        if (!this.extensionPort) return;
        const port = this.extensionPort;
        const { data } = message;
        if (!data || typeof data !== 'object') return;

        if (data.type === POPUP.ERROR) {
            // handle popup error
            const errorMessage =
                data.payload && typeof data.payload.error === 'string' ? data.payload.error : null;
            this.emit(POPUP.CLOSED, errorMessage ? `Popup error: ${errorMessage}` : null);
            this.clear();
        } else if (data.type === POPUP.LOADED) {
            if (this.popupPromise) {
                this.popupPromise.resolve();
            }
            this.iframeHandshake.promise.then(payload => {
                port.postMessage({
                    type: POPUP.INIT,
                    payload: {
                        ...payload,
                        settings: this.settings,
                    },
                });
            });
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

    handleMessage(message: MessageEvent) {
        // ignore messages from domain other then popup origin and without data
        // const data: CoreMessage = message.data;
        const { data } = message;
        if (getOrigin(message.origin) !== this.origin || !data || typeof data !== 'object') return;

        if (data.type === IFRAME.LOADED) {
            this.iframeHandshake.resolve(data.payload);
        } else if (data.type === POPUP.BOOTSTRAP) {
            // popup is opened properly, now wait for POPUP.LOADED message
            if (this.openTimeout) clearTimeout(this.openTimeout);
        } else if (data.type === POPUP.ERROR && this.popupWindow) {
            const errorMessage =
                data.payload && typeof data.payload.error === 'string' ? data.payload.error : null;
            this.emit(POPUP.CLOSED, errorMessage ? `Popup error: ${errorMessage}` : null);
            this.clear();
        } else if (data.type === POPUP.LOADED) {
            if (this.popupPromise) {
                this.popupPromise.resolve();
            }
            // popup is successfully loaded
            this.iframeHandshake.promise.then(payload => {
                // send ConnectSettings to popup
                // note this settings and iframe.ConnectSettings could be different (especially: origin, popup, webusb, debug)
                // now popup is able to load assets
                this.popupWindow.postMessage(
                    {
                        type: POPUP.INIT,
                        payload: {
                            ...payload,
                            settings: this.settings,
                        },
                    },
                    this.origin,
                );
            });
        } else if (data.type === POPUP.CANCEL_POPUP_REQUEST || data.type === UI.CLOSE_UI_WINDOW) {
            this.clear(false);
        }
    }

    clear(focus = true) {
        this.locked = false;
        this.popupPromise = undefined;

        if (this.requestTimeout) {
            window.clearTimeout(this.requestTimeout);
            this.requestTimeout = 0;
        }

        if (this.openTimeout) {
            clearTimeout(this.openTimeout);
            this.openTimeout = undefined;
        }
        if (this.closeInterval) {
            window.clearInterval(this.closeInterval);
            this.closeInterval = 0;
        }

        if (this.extensionPort) {
            this.extensionPort.disconnect();
            this.extensionPort = undefined;
        }

        // switch to previously focused tab

        if (focus && this.extensionTabId) {
            chrome.tabs.update(this.extensionTabId, { active: true });
            this.extensionTabId = 0;
        }
    }

    close() {
        if (!this.popupWindow) return;

        if (this.settings.env === 'webextension') {
            // @ts-expect-error
            let _e = chrome.runtime.lastError;

            chrome.tabs.remove(this.popupWindow.id, () => {
                _e = chrome.runtime.lastError;
            });
            return;
        }

        this.popupWindow.close();
        this.popupWindow = null;
    }

    async postMessage(message: CoreEventMessage) {
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
        if (this.popupWindow) {
            this.popupWindow.postMessage(message, this.origin);
        }
    }
}
