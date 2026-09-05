import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type Deferred, createDeferred } from '@trezor/utils';

const IFRAME_ID = 'trezor-connect-bootstrap';
const IFRAME_TIMEOUT = 10000;

const getIframeElement = (): HTMLIFrameElement | undefined =>
    (document.getElementById(IFRAME_ID) as HTMLIFrameElement | null) ?? undefined;

const createIframeElement = (): HTMLIFrameElement => {
    const instance = document.createElement('iframe');
    instance.id = IFRAME_ID;
    instance.frameBorder = '0';
    instance.width = '0px';
    instance.height = '0px';
    instance.style.position = 'absolute';
    instance.style.display = 'none';
    instance.style.border = '0px';
    instance.style.width = '0px';
    instance.style.height = '0px';

    return instance;
};

export const getIframeInstance = () => {
    let initPromise: Deferred<void> | undefined;
    let initTimeout: ReturnType<typeof setTimeout> | undefined;

    const clearInitTimeout = () => {
        if (initTimeout) {
            window.clearTimeout(initTimeout);
            initTimeout = undefined;
        }
    };

    const handleIframeBlocked = () => {
        clearInitTimeout();
        initPromise?.reject(ERRORS.TypedError('Handshake_Error', 'iframe-blocked'));
    };

    const handleIframeLoad = () => {
        const instance = getIframeElement();
        if (!instance) {
            return handleIframeBlocked();
        }

        try {
            // if the hosting page **is able to access** cross-origin location it means that the iframe is **NOT LOADED**
            const iframeOrigin = instance.contentWindow?.location.origin;
            if (!iframeOrigin || iframeOrigin === 'null') {
                return handleIframeBlocked();
            }
        } catch {
            // empty
        }

        instance.onload = null;
        initPromise?.resolve();
    };

    const create = (src: string) => {
        if (initPromise) {
            return initPromise.promise;
        }

        const instance = getIframeElement();
        if (instance) {
            return Promise.resolve();
        }

        initPromise = createDeferred();

        const newInstance = createIframeElement();
        initTimeout = setTimeout(() => {
            initPromise?.reject(ERRORS.TypedError('Handshake_Error', 'iframe-timeout'));
        }, IFRAME_TIMEOUT);

        newInstance.onload = handleIframeLoad;
        newInstance.setAttribute('src', src);
        document.body.appendChild(newInstance);

        return initPromise.promise
            .finally(() => {
                clearInitTimeout();
            })
            .catch(error => {
                // Reset state to allow initialization again.
                if (newInstance.parentNode) {
                    newInstance.parentNode.removeChild(newInstance);
                }
                // Clear the rejected deferred, otherwise the `if (initPromise)` guard above would
                // keep returning this same rejected promise and the iframe would never be recreated.
                initPromise = undefined;
                // Propagate TypedError to caller.
                throw error;
            });
    };

    // Tear the iframe down completely so the next create() rebuilds it from
    // scratch. The `.catch` above only clears state when the iframe *load*
    // rejects; a later failure (e.g. the bootstrap handshake) leaves a resolved
    // `initPromise` and a live iframe whose bootstrap/storage-access state is
    // reused. Recreating it mirrors what a page reload does (the only thing that
    // currently recovers such a failure).
    const destroy = () => {
        clearInitTimeout();
        getIframeElement()?.remove();
        initPromise = undefined;
    };

    return {
        create,
        get: getIframeElement,
        destroy,
    };
};
