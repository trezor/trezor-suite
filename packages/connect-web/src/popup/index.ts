// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/PopupManager.js

import { CoreEventMessage, DEVICE_EVENT, POPUP } from '@trezor/connect/src/events';
import type { ConnectSettings } from '@trezor/connect/src/types';
import { Log } from '@trezor/connect/src/utils/debug';
import { getOrigin } from '@trezor/connect/src/utils/urlUtils';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { CONTENT_SCRIPT_VERSION, VERSION } from '@trezor/connect-common/src/data/version';
import {
    AbstractMessageChannel,
    Message,
} from '@trezor/connect-common/src/messageChannel/abstract';
import { ServiceWorkerWindowChannel } from '@trezor/connect-common/src/messageChannel/serviceworker-window';
import { WindowWindowChannel } from '@trezor/connect-common/src/messageChannel/window-window';
import type { IntervalId } from '@trezor/type-utils';
import { Deferred, createDeferred, scheduleAction } from '@trezor/utils';

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

const POPUP_CLOSE_INTERVAL = 500;

type Params = Pick<ConnectSettings, 'manifest' | 'popupSrc' | 'env' | 'version'> & { logger: Log };

export class PopupManager {
    private popupWindow:
        | { mode: 'tab'; tab: chrome.tabs.Tab }
        | { mode: 'window'; window: Window }
        | undefined;

    private readonly env: Params['env'];
    private readonly popupSrc: Params['popupSrc'];
    private readonly settings: Pick<Params, 'manifest' | 'version'>;

    private origin: string;

    private locked = false;

    channel: AbstractMessageChannel<CoreEventMessage>;

    handshakePromise: Deferred<void> | undefined;

    private closeInterval: IntervalId | undefined;

    private extensionTabId = 0;

    private logger: Log;

    constructor({ env, popupSrc, manifest, version, logger }: Params) {
        this.settings = { manifest, version };
        this.origin = getOrigin(popupSrc);
        this.env = env;
        this.popupSrc = popupSrc;
        this.logger = logger;

        if (this.isWebExtensionWithTab()) {
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

        // Core mode
        this.handshakePromise = createDeferred();
        this.channel.on('message', this.handleCoreMessage.bind(this));
    }

    async request() {
        // popup request

        // check if current popup window is still open
        if (this.popupWindow?.mode === 'tab') {
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

        this.locked = true;
        this.open();
    }

    private open() {
        const src = this.popupSrc;
        const url = this.buildPopupUrl(src);
        this.openWrapper(url);

        this.closeInterval = setInterval(() => {
            if (!this.popupWindow) return;
            if (this.popupWindow.mode === 'tab' && this.popupWindow.tab.id) {
                chrome.tabs.get(this.popupWindow.tab.id, tab => {
                    if (!tab) {
                        // If no reference to popup window, it was closed by user or by this.close() method.
                        this.emitClosed();
                        this.clear();
                    }
                });
            } else if (this.popupWindow.mode === 'window' && this.popupWindow.window.closed) {
                this.clear();
                this.emitClosed();
            }
        }, POPUP_CLOSE_INTERVAL);
    }

    private buildPopupUrl(src: string) {
        const params = new URLSearchParams();
        params.set('version', VERSION);
        params.set('env', this.env);
        // Pass extension ID to popup via query string
        if (this.env === 'webextension' && chrome?.runtime?.id) {
            params.set('extension-id', chrome.runtime.id);
            params.set('cs-ver', CONTENT_SCRIPT_VERSION.toString());
        }

        return src + '?' + params.toString();
    }

    private openWrapper(url: string) {
        if (this.isWebExtensionWithTab()) {
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
                // Retry due to Firefox where the content script is sometimes not injected on the first try
                scheduleAction(
                    () =>
                        chrome.scripting
                            .executeScript({
                                target: { tabId },
                                // content script is injected into body of func in build time.
                                func: () => {
                                    // <!--content-script-->
                                },
                            })
                            .then(() => {
                                this.logger.debug('content script injected');
                            })
                            .catch(error => {
                                this.logger.error('content script injection error', error);
                                throw error;
                            }),
                    { attempts: new Array(3).fill({ timeout: 100 }) },
                );
            } else {
                // When permissions for `scripting` are not provided 3rd party integrations have include content-script.js manually.
            }
        });
    };

    private handleCoreMessage(message: Message<CoreEventMessage>) {
        if (message.type === POPUP.CORE_LOADED) {
            this.channel.postMessage({
                type: POPUP.HANDSHAKE,
                // in this case, settings will be validated in popup
                payload: { settings: this.settings },
            });
            this.handshakePromise?.resolve();
        } else if (message.type === POPUP.CLOSED) {
            this.emitClosed();
        } else if (message.type === POPUP.CONTENT_SCRIPT_LOADED) {
            const { contentScriptVersion } = message.payload;
            if (contentScriptVersion !== CONTENT_SCRIPT_VERSION) {
                console.warn(
                    `Content script version mismatch. Expected ${CONTENT_SCRIPT_VERSION}, got ${contentScriptVersion}`,
                );
            }
        } else if (message.event === DEVICE_EVENT) {
            // TODO what to do?
        }
    }

    private clear(focus = true) {
        this.locked = false;
        this.handshakePromise = createDeferred();

        if (this.channel) {
            this.channel.disconnect();
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

    private close() {
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
        this.channel.clear();
    }

    private isWebExtensionWithTab() {
        // Check if webextension actually has access to chrome.tabs API
        // This is not the case when used in offscreen context
        return (
            this.env === 'webextension' &&
            typeof chrome !== 'undefined' &&
            typeof chrome?.tabs !== 'undefined'
        );
    }

    public emitClosed() {
        // When popup is closed we should create a not-real response as if the request was interrupted.
        // Because when popup closes and TrezorConnect is living there it cannot respond, but we know
        // it was interrupted so we safely fake it.
        this.channel.resolveMessagePromises({
            success: false,
            error: TypedError('Method_Interrupted'),
        });
    }
}
