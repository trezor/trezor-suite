import { injectDesktopApi } from '@suite/desktop-app-api';
import { useMutation } from '@suite-common/react-query';
import { useServices } from '@trezor/dependency-injection';

/**
 * Clear persisted session of an given website
 */
export const useForgetAppData = () => {
    const { desktopApi } = useServices(injectDesktopApi);

    return useMutation({ mutationFn: desktopApi.inAppBrowserClearData });
};
