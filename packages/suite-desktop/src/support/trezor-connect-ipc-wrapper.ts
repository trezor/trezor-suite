// This file is a wrapper for trezor-connect imports in @trezor/suite.
// It could be eventually moved to trezor-connect/plugins.
// import is replaced by webpack config. (see @trezor/suite-build/configs/desktop.webpack.config)
// local imports and exports are intentionally set to /lib directory otherwise webpack NormalModuleReplacementPlugin would replace this line as well.

// @ts-ignore /lib directory is not typed
import TrezorConnect from 'trezor-connect/lib';

// @ts-ignore /lib directory is not typed
export * from 'trezor-connect/lib';

// override each method of trezor-connect
// use ipcRenderer message instead of iframe.postMessage (see ./src-electron/modules/trezor-connect-preloader)
Object.keys(TrezorConnect).forEach(method => {
    TrezorConnect[method] = (...params: any[]) =>
        window.TrezorConnectIpcChannel
            ? window.TrezorConnectIpcChannel(method, ...params)
            : {
                  success: false,
                  payload: { error: 'window.TrezorConnectIpcChannel is not defined' },
              };
});

export default TrezorConnect;
