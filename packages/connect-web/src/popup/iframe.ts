import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type Deferred, createDeferred } from '@trezor/utils';
import { getWeakRandomId } from '@trezor/utils/src/getWeakRandomId';

const IFRAME_TIMEOUT = 10000;

const createIframeElement = (id: string): HTMLIFrameElement => {
    const instance = document.createElement('iframe');
    instance.id = id;
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
    // Unique per manager, so two copies of connect-web on one page (or an
    // iframe left behind by a previous bundle) never share, and never tear
    // down, each other's iframe.
    const iframeId = `trezor-connect-bootstrap-${getWeakRandomId(8)}`;
    let initPromise: Deferred<void> | undefined;
    let initTimeout: ReturnType<typeof setTimeout> | undefined;

    const getIframeElement = (): HTMLIFrameElement | undefined =>
        (document.getElementById(iframeId) as HTMLIFrameElement | null) ?? undefined;

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

    // Tear the iframe down so the next create() rebuilds it from scratch,
    // mirroring what a page reload does. A failure that happens after the
    // iframe has loaded (e.g. the bootstrap handshake) leaves a resolved
    // initPromise and a live iframe behind, which create() would otherwise
    // reuse. A load still in flight is rejected so its awaiting create()
    // settles instead of hanging.
    const destroy = () => {
        const pendingInit = initPromise;
        clearInitTimeout();
        initPromise = undefined;
        getIframeElement()?.remove();
        pendingInit?.reject(ERRORS.TypedError('Handshake_Error', 'iframe-destroyed'));
    };

    const create = (src: string) => {
        if (initPromise) {
            return initPromise.promise;
        }

        const init = createDeferred();
        initPromise = init;

        const newInstance = createIframeElement(iframeId);
        initTimeout = setTimeout(() => {
            init.reject(ERRORS.TypedError('Handshake_Error', 'iframe-timeout'));
        }, IFRAME_TIMEOUT);

        newInstance.onload = handleIframeLoad;
        newInstance.setAttribute('src', src);
        document.body.appendChild(newInstance);

        return init.promise
            .finally(() => {
                // Skip once destroy() has moved on; the timeout then belongs
                // to the next attempt.
                if (initPromise === init) {
                    clearInitTimeout();
                }
            })
            .catch(error => {
                // Reset state to allow initialization again, unless destroy()
                // already did so (its rejection is what brought us here).
                if (initPromise === init) {
                    destroy();
                }
                // Propagate TypedError to caller.
                throw error;
            });
    };

    return {
        create,
        get: getIframeElement,
        destroy,
    };
};
