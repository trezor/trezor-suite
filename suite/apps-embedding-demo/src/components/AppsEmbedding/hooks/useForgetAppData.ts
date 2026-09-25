import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';
import { useMutation } from '@suite-common/react-query';

/**
 * Clear persisted session of an given website
 */
export const useForgetAppData = () => {
    const { desktopApi } = useServices(injectDesktopApi);

    return useMutation({ mutationFn: desktopApi.inAppBrowserClearData });
};
