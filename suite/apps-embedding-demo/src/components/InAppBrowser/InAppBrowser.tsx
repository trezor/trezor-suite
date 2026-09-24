import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { type HttpsUrl } from '@trezor/type-utils';

import { Slot } from './Slot/Slot';
import { Toolbar } from './Toolbar/Toolbar';
import { useInAppBrowser } from './hooks/useInAppBrowser';

type InAppBrowserProps = {
    targetUrl: string;
    entryId?: string;
    redirectExternalOrigins?: HttpsUrl[];
    popupExternalOrigins?: HttpsUrl[];
    onEvent: (event: AppsEmbeddingEvent) => void;
    isVisible: boolean;
};

/**
 * - This is will be moved to `@suite/apps-embedding-desktop` or `@suite/in-app-browser-desktop` once there's proper design and feat. specs.
 * - Until then, this is only a demo part, therefore it's here.
 */
export const InAppBrowser = ({
    targetUrl,
    entryId,
    redirectExternalOrigins,
    popupExternalOrigins,
    onEvent,
    isVisible,
}: InAppBrowserProps) => {
    const { navigationState } = useInAppBrowser({
        targetUrl,
        entryId,
        redirectExternalOrigins,
        popupExternalOrigins,
        onEvent,
    });

    return (
        <>
            <Toolbar navigationState={navigationState} />
            <Slot isVisible={isVisible} />
        </>
    );
};
