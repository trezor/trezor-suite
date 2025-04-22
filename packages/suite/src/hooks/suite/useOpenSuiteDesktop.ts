import TrezorConnect from '@trezor/connect';
import type TrezorConnectWeb from '@trezor/connect-web';
import { useWindowFocus } from '@trezor/react-utils';
import { SUITE_BRIDGE_DEEPLINK, SUITE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/reducers/suite/suiteReducer';

export const useOpenSuiteDesktop = () => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const windowFocused = useWindowFocus();
    const handleOpenSuite = () => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        iframe.src = SUITE_BRIDGE_DEEPLINK;

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            document.body.removeChild(iframe);
            if (isWebUsbTransport) {
                (TrezorConnect as typeof TrezorConnectWeb).disableWebUSB();
            }
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, 500);
    };

    return handleOpenSuite;
};
