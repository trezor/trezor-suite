import { useEffect, useState } from 'react';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';

/**
 * Whether this build lets the user open DevTools at all.
 *
 * Asked once, because the host answers from the build and the command line and neither changes
 * while the process runs. Starts `false` so the button is never drawn before the answer arrives — a
 * control that appears and then vanishes reads worse than one that appears a tick late.
 *
 * This only decides whether to offer the button. The host refuses the call on the same predicate,
 * which is what actually keeps an inspector off a build that should not have one.
 */
export function useCanOpenDevTools() {
    const { desktopApi } = useServices(injectDesktopApi);
    const [canOpenDevTools, setCanOpenDevTools] = useState(false);

    useEffect(() => {
        if (!desktopApi.available) {
            return;
        }

        desktopApi.inAppBrowserCanOpenDevTools().then(setCanOpenDevTools);
    }, [desktopApi]);

    return canOpenDevTools;
}
