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
    // The element this instance appended, as opposed to one it merely adopted
    // because it already carried IFRAME_ID (e.g. created by another copy of
    // connect-web on the same page).
    let ownedInstance: HTMLIFrameElement | undefined;

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

    // Tear down the iframe this instance created so the next create() rebuilds
    // it from scratch, mirroring what a page reload does. A failure that happens
    // after the iframe has loaded (e.g. the bootstrap handshake) leaves a resolved
    // initPromise and a live iframe behind, which create() would otherwise reuse.
    // A load still in flight is rejected so its awaiting create() settles instead
    // of hanging. An adopted element is left alone.
    const destroy = () => {
        const pendingInit = initPromise;
        clearInitTimeout();
        initPromise = undefined;
        ownedInstance?.remove();
        ownedInstance = undefined;
        pendingInit?.reject(ERRORS.TypedError('Handshake_Error', 'iframe-destroyed'));
    };

    const create = (src: string) => {
        if (initPromise) {
            return initPromise.promise;
        }

        const instance = getIframeElement();
        if (instance) {
            return Promise.resolve();
        }

        const init = createDeferred();
        initPromise = init;

        const newInstance = createIframeElement();
        ownedInstance = newInstance;
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
