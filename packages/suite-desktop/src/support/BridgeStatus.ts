import { useEffect } from 'react';
import { useSelector } from '@suite-hooks/useSelector';

/**
 * BridgeStatus handler for suite-desktop app
 * Asks electron main process to run `trezord` whenever TrezorConnect emits 'TRANSPORT.ERROR' event
 * @returns null
 */
const BridgeStatus = () => {
    const { transport, bridgeDevMode } = useSelector(state => ({
        transport: state.suite.transport,
        bridgeDevMode: state.suite.settings.debug.bridgeDevMode,
    }));

    useEffect(() => {
        if (!transport) return;
        if (!transport.type && window.desktopApi) {
            window.desktopApi.send('bridge/start');
        }
    }, [transport]);

    useEffect(() => {
        // run on toggling bridge dev mode
        if (window.desktopApi) {
            window.desktopApi.send('bridge/start', bridgeDevMode);
        }
    }, [bridgeDevMode]);

    return null;
};

export default BridgeStatus;
