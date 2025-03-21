import { useWindowFocus } from '@trezor/react-utils';
import { SUITE_BRIDGE_DEEPLINK, SUITE_URL } from '@trezor/urls';

export const useOpenSuiteDesktop = () => {
    const windowFocused = useWindowFocus();
    const handleOpenSuite = () => {
        location.href = SUITE_BRIDGE_DEEPLINK;

        // fallback in case deeplink does not work
        window.setTimeout(() => {
            if (!windowFocused.current) return;

            window.open(SUITE_URL);
        }, 500);
    };

    return handleOpenSuite;
};
