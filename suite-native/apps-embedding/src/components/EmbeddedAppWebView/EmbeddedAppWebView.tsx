import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';

import { EmbeddedAppWebViewFrame } from './EmbeddedAppWebViewFrame';
import { useEmbeddedAppTarget } from '../../hooks/useEmbeddedAppTarget';
import { type EmbeddedAppTarget } from '../../types';

type EmbeddedAppWebViewProps = {
    target: EmbeddedAppTarget;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

/**
 * Runs `target` inline, in a react-native-webview with a toolbar. Everything about a catalog
 * entry — its page, where it may navigate, whether it keeps its data — is read from the catalog,
 * never from the caller.
 */
export const EmbeddedAppWebView = ({ target, onEvent }: EmbeddedAppWebViewProps) => {
    const resolvedTarget = useEmbeddedAppTarget({ target, onEvent });

    // Already reported as a failed load; as on desktop, a target with nothing to open gets no
    // view at all.
    if (resolvedTarget === null) {
        return null;
    }

    return (
        <EmbeddedAppWebViewFrame
            // A frame per target, see the component: a switch must not reuse the WebView, and
            // with it the data store, of the page opened before.
            key={`${resolvedTarget.persistSession}:${resolvedTarget.url}`}
            url={resolvedTarget.url}
            allowedOrigins={resolvedTarget.allowedOrigins}
            persistSession={resolvedTarget.persistSession}
            onEvent={onEvent}
        />
    );
};
