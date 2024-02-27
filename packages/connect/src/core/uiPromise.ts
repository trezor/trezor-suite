import { createDeferred, Deferred } from '@trezor/utils';
import {
    UI,
    createUiMessage,
    UiPromise,
    AnyUiPromise,
    UiPromiseCreator,
    UiPromiseResponse,
} from '../events';
import { InteractionTimeout } from '../utils/interactionTimeout';

// Public variables
export let _popupPromise: Deferred<void> | undefined; // Waiting for popup handshake
export const _uiPromises: AnyUiPromise[] = []; // Waiting for ui response
export let _interactionTimeout: InteractionTimeout;

/**
 * Creates an instance of _popupPromise.
 * If Core is used without popup this promise should be always resolved automatically
 * @param {boolean} requestWindow
 * @returns {Deferred<void>}
 * @memberof Core
 */
export const getPopupPromise = (requestWindow = true) => {
    // request ui window (used with modal)
    if (requestWindow) {
        postMessage(createUiMessage(UI.REQUEST_UI_WINDOW));
    }
    if (!_popupPromise) {
        _popupPromise = createDeferred();
    }

    return _popupPromise;
};

export const initInteractionTimeout = (seconds?: number) => {
    _interactionTimeout = new InteractionTimeout(seconds);
};

/**
 * Start interaction timeout timer
 */
export const interactionTimeout = (onTriggered: any) =>
    _interactionTimeout.start(() => {
        // onPopupClosed('Interaction timeout');
        onTriggered();
    });

/**
 * Creates an instance of uiPromise.
 * @param {string} promiseEvent
 * @param {Device} device
 * @returns {Deferred<UiPromise>}
 * @memberof Core
 */
export const createUiPromise: UiPromiseCreator = (
    promiseEvent,
    device,
    onInteractionTimeoutTriggered,
) => {
    const uiPromise: UiPromise<typeof promiseEvent> = {
        ...createDeferred(promiseEvent),
        device,
    };
    _uiPromises.push(uiPromise as unknown as AnyUiPromise);

    // Interaction timeout
    interactionTimeout(onInteractionTimeoutTriggered);

    return uiPromise;
};

/**
 * Finds an instance of uiPromise.
 * @param {string} promiseEvent
 * @returns {Deferred<UiPromise> | void}
 * @memberof Core
 */
export const findUiPromise = <T extends UiPromiseResponse['type']>(promiseEvent: T) =>
    _uiPromises.find(p => p.id === promiseEvent) as UiPromise<T> | undefined;

export const removeUiPromise = (promise: Deferred<any>) => {
    _uiPromises.splice(0).push(..._uiPromises.filter(p => p !== promise));
};
