import TrezorConnect from '@trezor/connect';
import type TrezorConnectWeb from '@trezor/connect-web';
import { useWindowFocus } from '@trezor/react-utils';
import { SUITE_BRIDGE_DEEPLINK, SUITE_URL } from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import { selectIsWebUsb } from 'src/reducers/suite/suiteReducer';

export const useOpenSuiteDesktop = () => {
    const isWebUsbTransport = useSelector(selectIsWebUsb);
    const windowFocused = useWindowFocus();
    const handleOpenSuite = () => {
        if (isWebUsbTransport) {
            (TrezorConnect as typeof TrezorConnectWeb).disableWebUSB();
        }

        location.href = SUITE_BRIDGE_DEEPLINK;

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, 500);
    };

    return handleOpenSuite;
};
