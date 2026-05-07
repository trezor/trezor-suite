import TrezorConnect from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: expose the browser-specific TrezorConnect type via the @trezor/connect barrel and remove this exception (see #27376)
import type TrezorConnectBrowser from '@trezor/connect/src/index.browser';
import { useWindowFocus } from '@trezor/react-utils';
import { SUITE_BRIDGE_DEEPLINK, SUITE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

export const useOpenSuiteDesktop = () => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const windowFocused = useWindowFocus();
    const handleOpenSuite = () => {
        const iframe = document.createElement('iframe');
        iframe.src = SUITE_BRIDGE_DEEPLINK;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            document.body.removeChild(iframe);
            if (isWebUsbTransport) {
                (TrezorConnect as typeof TrezorConnectBrowser).disableWebUSB();
            }
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, 500);
    };

    return handleOpenSuite;
};
