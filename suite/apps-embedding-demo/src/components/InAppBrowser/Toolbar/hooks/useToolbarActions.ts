import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';
import { useMutation } from '@suite-common/react-query';

import { LOCAL_IPC_MUTATION_OPTIONS } from '../../constants';

/**
 * The in-app browser bar's actions.
 */
export function useToolbarActions() {
    const { desktopApi } = useServices(injectDesktopApi);

    const goBack = useMutation({
        mutationFn: desktopApi.inAppBrowserGoBack,
        ...LOCAL_IPC_MUTATION_OPTIONS,
    });
    const goForward = useMutation({
        mutationFn: desktopApi.inAppBrowserGoForward,
        ...LOCAL_IPC_MUTATION_OPTIONS,
    });
    const reload = useMutation({
        mutationFn: desktopApi.inAppBrowserReload,
        ...LOCAL_IPC_MUTATION_OPTIONS,
    });
    const toggleDevTools = useMutation({
        mutationFn: desktopApi.inAppBrowserToggleDevTools,
        ...LOCAL_IPC_MUTATION_OPTIONS,
    });

    return { goBack, goForward, reload, toggleDevTools };
}
