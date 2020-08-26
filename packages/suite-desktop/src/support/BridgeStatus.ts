import { useEffect } from 'react';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    transport: state.suite.transport,
    bridgeDevMode: state.suite.settings.debug.bridgeDevMode,
});

type Props = ReturnType<typeof mapStateToProps>;

/**
 * BridgeStatus handler for suite-desktop app
 * Asks electron main process to run `trezord` whenever TrezorConnect emits 'TRANSPORT.ERROR' event
 * @param {Props} { transport }
 * @returns null
 */
const BridgeStatus = ({ transport, bridgeDevMode }: Props) => {
    useEffect(() => {
        if (!transport) return;
        // @ts-ignore global.ipcRenderer is declared in @desktop/preloader.js
        const { ipcRenderer } = global;
        if (!transport.type && ipcRenderer) {
            ipcRenderer.send('start-bridge');
        }
    }, [transport]);

    useEffect(() => {
        // run on toggling bridge dev mode
        // @ts-ignore global.ipcRenderer is declared in @desktop/preloader.js
        const { ipcRenderer } = global;
        if (ipcRenderer) {
            ipcRenderer.send('start-bridge', bridgeDevMode);
        }
    }, [bridgeDevMode]);

    return null;
};

export default connect(mapStateToProps)(BridgeStatus);
