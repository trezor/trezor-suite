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
        if (!transport.type && window.desktop_api) {
            window.desktop_api.send('start-bridge');
        }
    }, [transport]);

    useEffect(() => {
        // run on toggling bridge dev mode
        if (window.desktop_api) {
            window.desktop_api.send('start-bridge', bridgeDevMode);
        }
    }, [bridgeDevMode]);

    return null;
};

export default connect(mapStateToProps)(BridgeStatus);
