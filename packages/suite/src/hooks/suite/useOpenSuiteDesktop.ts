import TrezorConnect from '@trezor/connect';
import type TrezorConnectBrowser from '@trezor/connect/src/index-browser';
import { useWindowFocus } from '@trezor/react-utils';
import { SUITE_BRIDGE_DEEPLINK, SUITE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

// Firefox does not trigger custom protocol handlers via hidden iframe like Chromium-based browsers do.
// A direct anchor click must be used instead, and a longer timeout is required since
// the user needs to interact with Firefox's protocol-handler dialog before the app takes focus.
const IS_FIREFOX = typeof navigator !== 'undefined' && /Firefox\//.test(navigator.userAgent);
const DEEPLINK_TIMEOUT_MS = 500;
const DEEPLINK_TIMEOUT_FIREFOX_MS = 3000;

export const useOpenSuiteDesktop = () => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const windowFocused = useWindowFocus();
    const handleOpenSuite = () => {
        if (IS_FIREFOX) {
            // Firefox ignores custom protocol URLs loaded in an iframe.
            // Clicking an anchor element correctly triggers the system protocol-handler dialog.
            const a = document.createElement('a');
            a.href = SUITE_BRIDGE_DEEPLINK;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.src = SUITE_BRIDGE_DEEPLINK;

            window.setTimeout(() => {
                document.body.removeChild(iframe);
            }, DEEPLINK_TIMEOUT_MS);
        }

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            if (isWebUsbTransport) {
                (TrezorConnect as typeof TrezorConnectBrowser).disableWebUSB();
            }
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, IS_FIREFOX ? DEEPLINK_TIMEOUT_FIREFOX_MS : DEEPLINK_TIMEOUT_MS);
    };

    return handleOpenSuite;
};
