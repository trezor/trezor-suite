import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type Deferred, createDeferred } from '@trezor/utils';

// removed: https://github.com/trezor/trezor-suite/pull/23829/changes#diff-9bb4c75219a0f4f7469ff7539e3388d6648f0c14a7f6d168369fe1ad8f0baeaa

const IFRAME_ID = 'trezor-connect-iframe';

const getIframeElement = (): HTMLIFrameElement | undefined =>
    document.getElementById(IFRAME_ID) as HTMLIFrameElement;

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
        initPromise?.reject(ERRORS.TypedError('Popup_ConnectionMissing'));
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

        initPromise = createDeferred();

        let instance = getIframeElement();
        if (instance) {
            return Promise.resolve();
        } else {
            instance = createIframeElement();
        }
        // TODO check if iframe is already loaded and onLoad is not called (e.g. when iframe is cached) and resolve the promise in that case

        initTimeout = setTimeout(() => {
            initPromise?.reject(ERRORS.TypedError('Init_IframeTimeout'));
        }, 10000);

        instance.onload = handleIframeLoad;
        instance.setAttribute('src', src);
        // instance.setAttribute('sandbox', 'allow-scripts allow-same-origin');

        // try to inject iframe into host document body
        if (document.body) {
            document.body.appendChild(instance);
        } else {
            throw ERRORS.TypedError('Popup_ConnectionMissing');
        }

        return initPromise.promise
            .finally(() => {
                clearInitTimeout();
            })
            .catch(error => {
                // reset state to allow initialization again
                if (instance) {
                    if (instance.parentNode) {
                        instance.parentNode.removeChild(instance);
                    }
                    instance = undefined;
                }
                // propagate error to caller
                throw error;
            });
    };

    return {
        create,
        get: getIframeElement,
    };
};
