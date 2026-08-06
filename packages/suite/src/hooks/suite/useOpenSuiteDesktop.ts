import { type TransportName, type TransportsDep } from '@suite-common/connect-init';
import { useServices } from '@suite-common/dependency-injection';
import TrezorConnect from '@trezor/connect';
import { useWindowFocus } from '@trezor/react-utils';
import { SUITE_BRIDGE_DEEPLINK, SUITE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import {
    selectActiveTransports,
    selectHasTransportOfType,
} from 'src/selectors/suite/suiteSelectors';

export const useOpenSuiteDesktop = () => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const activeTransports = useSelector(selectActiveTransports);
    const windowFocused = useWindowFocus();
    const { createTransports } = useServices((services): TransportsDep => ({
        createTransports: services.createTransports,
    }));

    const handleOpenSuite = () => {
        const iframe = document.createElement('iframe');
        iframe.src = SUITE_BRIDGE_DEEPLINK;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            document.body.removeChild(iframe);
            if (isWebUsbTransport) {
                // Suite Desktop (opened via the deeplink) starts a Bridge server; we route the web
                // session through Bridge so the device is shared via Suite Desktop as a central hub.
                const filtered = activeTransports
                    .filter(t => t.type !== 'WebUsbTransport')
                    .map(t => t.type);
                TrezorConnect.updateConnectSettings({
                    transports: createTransports(
                        (filtered.includes('BridgeTransport')
                            ? filtered
                            : ['BridgeTransport', ...filtered]) as TransportName[],
                    ),
                });
            }
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, 500);
    };

    return handleOpenSuite;
};
