import {
    type CoinInfo,
    type CoreEventMessage,
    type DiscoveryAccount,
    UI_REQUEST,
    UI_RESPONSE,
    type UiResponseDiscoveryAccounts,
    createUiMessage,
} from '@trezor/connect-common';
import { resolveAfter } from '@trezor/utils/src/resolveAfter';

import type { UiPromiseCreator } from '../../events/ui-promise';
import type { IDevice } from '../../types/idevice';

const REQUEST_TIMEOUT_MS = 200;

/**
 * Sends UI_REQUEST.REQUEST_DISCOVERY_ACCOUNTS to the host (e.g. Suite) and waits for a response.
 * If the host provides existing accounts, returns them. Otherwise returns null so the caller
 * can fall back to device discovery.
 */
export const requestExistingAccounts = async ({
    postMessage,
    createUiPromise,
    device,
    coinInfo,
}: {
    postMessage: (message: CoreEventMessage) => void;
    createUiPromise: UiPromiseCreator;
    device: IDevice;
    coinInfo: CoinInfo;
}): Promise<DiscoveryAccount[] | null> => {
    const dfd = createUiPromise(UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNTS, device);

    postMessage(createUiMessage(UI_REQUEST.REQUEST_DISCOVERY_ACCOUNTS, { coinInfo }));

    const result = await Promise.race([
        dfd.promise.then((response: UiResponseDiscoveryAccounts) => response.payload),
        resolveAfter(REQUEST_TIMEOUT_MS).then(() => null),
    ]);

    if (result === null) {
        dfd.reject(new Error('No discovery accounts handler'));

        return null;
    }

    return result.accounts.length > 0 ? result.accounts : null;
};
