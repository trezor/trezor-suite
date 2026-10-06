import { useRef } from 'react';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { useWindowMessages } from '@trezor/react-utils';

export type UseEmbeddedAppIframeParams = {
    /**
     * Allow to receive messages only from specific origin. I.e. the origin of the iframe src.
     */
    origin?: string;

    /**
     * Doesn't have to be stable reference.
     */
    onEvent: (event: AppsEmbeddingEvent) => void;
};

export const useEmbeddedAppIframe = ({ onEvent, origin }: UseEmbeddedAppIframeParams) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const isSameOrigin = Boolean(location.origin === origin);

    useWindowMessages({
        enabled: Boolean(origin),
        targetOrigin: origin,
        targetWindow: isSameOrigin ? ref.current?.contentWindow : window,
        onMessage(message) {
            onEvent({
                type: 'message',
                data: message,
            });
        },
    });

    function onLoad() {
        onEvent({
            type: 'loaded',
            detail: `iframe loaded: ${ref.current?.src}`,
        });
    }

    function onError() {
        onEvent({
            type: 'load-failed',
            detail: `iframe load failed: ${ref.current?.src}`,
        });
    }

    return { ref, onLoad, onError };
};
