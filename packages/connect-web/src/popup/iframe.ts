import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { type Deferred, createDeferred } from '@trezor/utils';

// removed: https://github.com/trezor/trezor-suite/pull/23829/changes#diff-9bb4c75219a0f4f7469ff7539e3388d6648f0c14a7f6d168369fe1ad8f0baeaa

const getIframeElement = (): HTMLIFrameElement | null =>
    document.getElementById('trezorconnect') as HTMLIFrameElement;

const createIframeElement = (): HTMLIFrameElement => {
    const instance = document.createElement('iframe');
    instance.frameBorder = '0';
    instance.width = '0px';
    instance.height = '0px';
    instance.style.position = 'absolute';
    instance.style.display = 'none';
    instance.style.border = '0px';
    instance.style.width = '0px';
    instance.style.height = '0px';
    instance.id = 'trezorconnect';

    return instance;
};

export const getIframe = () => {
    const instance = getIframeElement();

    if (!instance) {
        // throw ERRORS.TypedError('Iframe_NotFound');
    }
    if (!instance?.contentWindow) {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }

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
        // initPromise.reject(ERRORS.TypedError('Init_IframeBlocked'));
        initPromise?.reject(ERRORS.TypedError('Popup_ConnectionMissing'));
    };

    const onLoad = () => {
        const instance = getIframeElement();
        if (!instance) {
            handleIframeBlocked();

            return;
        }

        try {
            // if hosting page is able to access cross-origin location it means that the iframe is NOT LOADED!
            const iframeOrigin = instance.contentWindow?.location.origin;
            if (!iframeOrigin || iframeOrigin === 'null') {
                handleIframeBlocked();

                return;
            }
        } catch {
            // empty
        }

        instance.onload = null;
    };

    const create = async (src: string) => {
        if (initPromise) {
            return initPromise.promise;
        }

        initPromise = createDeferred();

        let instance = getIframeElement();
        if (!instance) {
            instance = createIframeElement();
        }
        // TODO check if iframe is already loaded and onLoad is not called (e.g. when iframe is cached) and resolve the promise in that case

        // initTimeout = window.setTimeout(() => {
        //     initPromise.reject(ERRORS.TypedError('Init_IframeTimeout'));
        // }, 10000);

        // TODO try catch?
        instance.setAttribute('src', src);

        // IE hack
        // @ts-expect-error
        if (instance.attachEvent) {
            // @ts-expect-error
            instance.attachEvent('onload', onLoad);
        } else {
            instance.onload = onLoad;
        }
        // try to inject iframe into host document body
        if (document.body) {
            // TODO try catch?
            document.body.appendChild(instance);
        } else {
            // TODO: error
            throw ERRORS.TypedError('Popup_ConnectionMissing');
        }

        try {
            await initPromise.promise;
        } catch (error) {
            // reset state to allow initialization again
            if (instance) {
                if (instance.parentNode) {
                    instance.parentNode.removeChild(instance);
                }
                instance = null;
            }
            // propagate error to caller
            throw error;
        } finally {
            clearInitTimeout();
        }
    };

    const postMessage = (message: any) => {
        const instance = getIframe();
        instance.contentWindow?.postMessage(message, '*');
    };

    return {
        initPromise,
        create,
        postMessage,
    };
};
