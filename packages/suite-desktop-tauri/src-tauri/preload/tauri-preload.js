// Tauri preload — injected as a WebView initialization script (runs before any page
// bundle). It reconstructs `window.desktopApi` in plain JS (mirroring
// @trezor/suite-desktop-api's renderer factory) so that when the Suite desktop bundle
// first imports `@trezor/suite-desktop-api`, `getDesktopApi()` finds a ready object.
// This mirrors how the Electron preload uses contextBridge before the renderer loads.
//
// Every method forwards over a single Rust command (`desktop_invoke` for request/response,
// `desktop_send` for fire-and-forget). Main-process events are delivered via Tauri events
// on the channel `desktop://<channel>` and re-dispatched to on()/once() listeners.
(function () {
    'use strict';

    function core() {
        return window.__TAURI__ && window.__TAURI__.core;
    }
    function tauriEvent() {
        return window.__TAURI__ && window.__TAURI__.event;
    }

    function invoke(channel, args) {
        var c = core();
        if (!c) return Promise.reject(new Error('Tauri core unavailable for ' + channel));
        return c.invoke('desktop_invoke', { channel: channel, args: args || [] });
    }
    function send(channel, args) {
        var c = core();
        if (!c) return;
        c.invoke('desktop_send', { channel: channel, args: args || [] }).catch(function () {});
    }

    // --- event plumbing -----------------------------------------------------
    // listeners: channel -> array of { fn, unlistenPromise }
    var listeners = {};
    function addListener(channel, fn, once) {
        var ev = tauriEvent();
        if (!ev) return;
        var entry = { fn: fn, wrapped: null, unlisten: null, removed: false, fired: false };
        var wrapped = function (event) {
            // guard against re-delivery for once(): if the event fires before ev.listen() resolved
            // (so entry.unlisten is still null), the underlying subscription is still live and would
            // call us again — drop the second delivery and detach as soon as we can.
            if (once && entry.fired) return;
            entry.fired = true;
            var payload = event && event.payload;
            var args = Array.isArray(payload) ? payload : [payload];
            try {
                fn.apply(null, args);
            } finally {
                if (once) removeListener(channel, entry);
            }
        };
        entry.wrapped = wrapped;
        listeners[channel] = listeners[channel] || [];
        listeners[channel].push(entry);
        ev.listen('desktop://' + channel, wrapped).then(function (un) {
            entry.unlisten = un;
            // if removeListener ran before listen() resolved, detach now
            if (entry.removed) un();
        });
    }
    function removeListener(channel, entry) {
        var arr = listeners[channel];
        if (!arr) return;
        var i = arr.indexOf(entry);
        if (i >= 0) {
            entry.removed = true;
            if (entry.unlisten) entry.unlisten();
            arr.splice(i, 1);
        }
    }
    function removeAll(channel) {
        var arr = listeners[channel];
        if (!arr) return;
        arr.forEach(function (e) {
            if (e.unlisten) e.unlisten();
        });
        listeners[channel] = [];
    }

    // --- method → channel maps (from suite-desktop-api renderer.ts) ----------
    var INVOKE = {
        getAppAutoStartIsEnabled: 'app/auto-start/is-enabled',
        appAutoStartPopupAck: 'app/auto-start/popup-ack',
        appAutoStartPopupResponse: 'app/auto-start/popup-response',
        appIsVisible: 'app/is-visible',
        appIsFullScreen: 'app/is-fullscreen',
        handshake: 'handshake/client',
        loadModules: 'handshake/load-modules',
        loadTorModule: 'handshake/load-tor-module',
        metadataRead: 'metadata/read',
        metadataWrite: 'metadata/write',
        metadataGetFiles: 'metadata/get-files',
        metadataRenameFile: 'metadata/rename-file',
        getHttpReceiverAddress: 'server/request-address',
        toggleTor: 'tor/toggle',
        getTorSettings: 'tor/get-settings',
        changeTorSettings: 'tor/change-settings',
        clearUserData: 'user-data/clear',
        openUserDataDirectory: 'user-data/open',
        getBridgeStatus: 'bridge/get-status',
        toggleBridge: 'bridge/toggle',
        changeBridgeSettings: 'bridge/change-settings',
        getBridgeSettings: 'bridge/get-settings',
        changeTraySettings: 'tray/change-settings',
        getTraySettings: 'tray/get-settings',
        connectPopupEnabled: 'connect-popup/enabled',
        connectPopupSetEnabled: 'connect-popup/set-enabled',
        connectPopupReady: 'connect-popup/ready',
        connectPopupResponse: 'connect-popup/response',
        openSystemSettings: 'system/open-settings',
        setBioAuthSettings: 'bio-auth/set-bio-auth-settings',
        getBioAuthSettings: 'bio-auth/get-bio-auth-settings',
        validateBioAuth: 'bio-auth/validate-bio-auth',
        isBioAuthAvailable: 'bio-auth/is-bio-auth-available',
        getBioAuthStatus: 'bio-auth/get-validation-status',
        safeStoreEncrypt: 'safe-storage/encrypt',
        safeStoreDecrypt: 'safe-storage/decrypt',
        mcpGetSettings: 'mcp/get-settings',
        mcpSetEnabled: 'mcp/set-enabled',
        mcpRegenerateToken: 'mcp/regenerate-token',
        reloadBrowserWindow: 'browser-window/reload',
    };
    var SEND = {
        appRestart: 'app/restart',
        appFocus: 'app/focus',
        appHide: 'app/hide',
        appAutoStart: 'app/auto-start',
        checkForUpdates: 'update/check',
        downloadUpdate: 'update/download',
        installUpdate: 'update/install',
        cancelUpdate: 'update/cancel',
        allowPrerelease: 'update/allow-prerelease',
        setAutomaticUpdateEnabled: 'update/set-automatic-update-enabled',
        setAutoInstallOnAppQuit: 'update/set-auto-install-on-app-quit',
        themeChange: 'theme/change',
        getTorStatus: 'tor/get-status',
        clearStore: 'store/clear',
        configLogger: 'logger/config',
    };

    var desktopApi = {
        available: true,
        on: function (channel, listener) {
            addListener(channel, listener, false);
        },
        once: function (channel, listener) {
            addListener(channel, listener, true);
        },
        removeAllListeners: function (channel) {
            removeAll(channel);
        },
    };

    Object.keys(INVOKE).forEach(function (method) {
        var channel = INVOKE[method];
        desktopApi[method] = function () {
            return invoke(channel, Array.prototype.slice.call(arguments));
        };
    });
    Object.keys(SEND).forEach(function (method) {
        var channel = SEND[method];
        desktopApi[method] = function () {
            send(channel, Array.prototype.slice.call(arguments));
        };
    });

    window.desktopApi = desktopApi;

    // External links: Electron routes window.open/target=_blank through
    // setWindowOpenHandler → shell.openExternal. WKWebView has no window-open handler
    // for the page, so intercept here and hand the URL to the Rust side.
    function openExternal(url) {
        if (!url) return;
        send('__external-link', [String(url)]);
    }
    var isExternal = function (url) {
        try {
            var u = new URL(String(url), location.href);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
            return (
                u.host !== location.host && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1'
            );
        } catch (e) {
            return false;
        }
    };
    window.open = function (url) {
        openExternal(url);
        return null;
    };
    document.addEventListener(
        'click',
        function (e) {
            var el = e.target;
            while (el && el.tagName !== 'A') el = el.parentElement;
            if (el && el.href && (el.target === '_blank' || isExternal(el.href))) {
                e.preventDefault();
                openExternal(el.href);
            }
        },
        true,
    );

    // --- window.ipcProxy: Bluetooth over @trezor/ipc-proxy -------------------
    // Electron exposes window.ipcProxy (backed by ipcRenderer) so the renderer's
    // createIpcProxy('Bluetooth') can talk to the main-process BLE stack. Tauri has no Node main,
    // so the BLE stack runs in a sidecar (packages/suite-desktop-tauri/bluetooth-host) and this
    // ipcProxy is a WebSocket client to it. This is a faithful port of @trezor/ipc-proxy's
    // createIpcProxyApi, transported over ws instead of Electron IPC.
    (function installIpcProxy() {
        var HOST_BASE = 'ws://127.0.0.1:21329';
        var socket = null;
        var openQueue = [];
        var invId = 0;
        var pending = {}; // invoke id -> {resolve,reject}
        var eventListeners = {}; // channel -> [ {cb, once} ]
        // add-listener 'send' frames must be re-sent after a reconnect so the host re-registers
        // this connection's subscriptions (the old connection's registrations are gone).
        var addListenerFrames = {}; // ipcEventName -> [eventName, ipcEventName] add-listener args
        var token = null;

        function connect() {
            // Authenticate with the per-launch shared secret (see bluetooth.rs / ws-ipc-main.ts).
            var url = token ? HOST_BASE + '?token=' + encodeURIComponent(token) : HOST_BASE;
            try {
                socket = new WebSocket(url);
            } catch (e) {
                setTimeout(connect, 1000);
                return;
            }
            socket.onopen = function () {
                // re-register every still-active add-listener subscription on the new connection
                Object.keys(addListenerFrames).forEach(function (ipcEventName) {
                    rawSend({
                        t: 'send',
                        channel: reAddChannel(ipcEventName),
                        args: addListenerFrames[ipcEventName],
                    });
                });
                var q = openQueue;
                openQueue = [];
                q.forEach(function (m) {
                    if (socket && socket.readyState === 1) socket.send(m);
                });
            };
            socket.onclose = function () {
                socket = null;
                // fail every in-flight invoke so callers don't hang forever across a sidecar restart
                Object.keys(pending).forEach(function (id) {
                    var p = pending[id];
                    delete pending[id];
                    try {
                        p.reject('ipc-proxy connection lost');
                    } catch (e) {}
                });
                setTimeout(connect, 1000);
            };
            socket.onerror = function () {
                if (socket)
                    try {
                        socket.close();
                    } catch (e) {}
            };
            socket.onmessage = function (ev) {
                var msg;
                try {
                    msg = JSON.parse(ev.data);
                } catch (e) {
                    return;
                }
                if (msg.t === 'invoke-res') {
                    var p = pending[msg.id];
                    if (!p) return;
                    delete pending[msg.id];
                    if (msg.ok) p.resolve(msg.value);
                    else p.reject(msg.error);
                } else if (msg.t === 'event') {
                    var arr = (eventListeners[msg.channel] || []).slice();
                    arr.forEach(function (entry) {
                        // ipcRenderer listeners are called (electronEvent, payload)
                        entry.cb(undefined, msg.data);
                        if (entry.once) removeRawListener(msg.channel, entry);
                    });
                }
            };
        }

        // the add-listener frame's channel is '<Channel>/<instance>/add-listener'; we stored args
        // keyed by ipcEventName, so recover the channel by stripping the '/event-listener/<ev>' tail
        function reAddChannel(ipcEventName) {
            var i = ipcEventName.indexOf('/event-listener/');
            return i >= 0 ? ipcEventName.slice(0, i) + '/add-listener' : ipcEventName;
        }

        function rawSend(obj) {
            var m = JSON.stringify(obj);
            if (socket && socket.readyState === 1) socket.send(m);
            else openQueue.push(m);
        }
        function removeRawListener(channel, entry) {
            var arr = eventListeners[channel];
            if (!arr) return;
            var i = arr.indexOf(entry);
            if (i >= 0) arr.splice(i, 1);
        }

        // ipcRenderer-shaped shim (only the parts createIpcProxyApi uses)
        var ipcRenderer = {
            invoke: function (channel, args) {
                return new Promise(function (resolve, reject) {
                    var id = ++invId;
                    pending[id] = { resolve: resolve, reject: reject };
                    rawSend({ t: 'invoke', id: id, channel: channel, args: args });
                });
            },
            send: function (channel, args) {
                rawSend({ t: 'send', channel: channel, args: args });
            },
            on: function (channel, cb) {
                eventListeners[channel] = eventListeners[channel] || [];
                eventListeners[channel].push({ cb: cb, once: false });
            },
            once: function (channel, cb) {
                eventListeners[channel] = eventListeners[channel] || [];
                eventListeners[channel].push({ cb: cb, once: true });
            },
            removeAllListeners: function (channel) {
                eventListeners[channel] = [];
            },
            listenerCount: function (channel) {
                return (eventListeners[channel] || []).length;
            },
        };

        // faithful port of createIpcProxyApi (packages/ipc-proxy/src/proxy-generator.ts)
        var requestId = 0;
        window.ipcProxy = {
            create: function (channelName, instanceId, constructorParams) {
                return ipcRenderer.invoke(channelName + '/create', [
                    channelName + '/' + instanceId,
                    constructorParams,
                ]);
            },
            request: function (channelName, instanceId, method, args) {
                return new Promise(function (resolve, reject) {
                    requestId++;
                    var responseEvent = channelName + '/' + instanceId + '/response/' + requestId;
                    ipcRenderer.once(responseEvent, function (_, response) {
                        if (response.success) resolve(response.payload);
                        else reject(response.error);
                    });
                    ipcRenderer.send(channelName + '/' + instanceId + '/request', [
                        responseEvent,
                        method,
                        args,
                    ]);
                });
            },
            setHandler: function (channelName, instanceId, eventName, listener) {
                var ipcEventName = channelName + '/' + instanceId + '/event-listener/' + eventName;
                if (ipcRenderer.listenerCount(ipcEventName)) {
                    ipcRenderer.removeAllListeners(ipcEventName);
                } else {
                    var frameArgs = [eventName, ipcEventName];
                    // remember it so a reconnect can re-register the subscription with the host
                    addListenerFrames[ipcEventName] = frameArgs;
                    ipcRenderer.send(channelName + '/' + instanceId + '/add-listener', frameArgs);
                }
                ipcRenderer.on(ipcEventName, function (_, event) {
                    listener(event);
                });
            },
            clearHandler: function (channelName, instanceId, eventName) {
                var ipcEventName = channelName + '/' + instanceId + '/event-listener/' + eventName;
                delete addListenerFrames[ipcEventName];
                ipcRenderer.removeAllListeners(ipcEventName);
                ipcRenderer.send(channelName + '/' + instanceId + '/remove-listener', [
                    eventName,
                    ipcEventName,
                ]);
            },
        };

        // fetch the per-launch bluetooth token, then connect (falls back to tokenless in dev)
        var c = core();
        if (c) {
            c.invoke('bluetooth_token_cmd')
                .then(function (t) {
                    token = t || null;
                })
                .catch(function () {})
                .then(function () {
                    connect();
                });
        } else {
            connect();
        }
    })();

    // Electron preload also exposes these; provide safe equivalents.
    window.desktopFlags = { exposeStore: true };
    window.electronFind = { onShow: function () {}, offShow: function () {} };
    if (typeof window.cspNonce === 'undefined') window.cspNonce = '';

    // diagnostics: report boot so the CLI/log can confirm the frontend booted
    try {
        if (core()) {
            core().invoke('tauri_report', {
                kind: 'preload',
                message:
                    'window.desktopApi installed (' +
                    (Object.keys(INVOKE).length + Object.keys(SEND).length) +
                    ' methods)',
            });
        }
    } catch (e) {}
})();
