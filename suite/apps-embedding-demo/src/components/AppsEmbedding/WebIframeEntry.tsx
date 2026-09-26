import {
    EmbeddedAppIframe,
    useEmbeddedAppIframe,
    useIframeOrigin,
} from '@suite/apps-embedding-web';
import { type AppsEmbeddingEvent, type PlatformSpecificOfKind } from '@suite-common/apps-embedding';

type WebIframeEntryProps = {
    onEvent: (event: AppsEmbeddingEvent) => void;
    targetUrl: string;
    embedTitle: string;
    webEntry: PlatformSpecificOfKind<'web'> | null;
};

export const WebIframeEntry = ({
    onEvent,
    targetUrl,
    embedTitle,
    webEntry,
}: WebIframeEntryProps) => {
    const iframeOrigin = useIframeOrigin(targetUrl);
    const { ref, onLoad, onError } = useEmbeddedAppIframe({
        onEvent,
        origin: iframeOrigin,
    });

    return (
        <EmbeddedAppIframe
            src={targetUrl}
            title={embedTitle}
            allow={webEntry?.allow}
            sandbox={webEntry?.sandbox}
            onEvent={onEvent}
            ref={ref}
            onLoad={onLoad}
            onError={onError}
        />
    );
};
