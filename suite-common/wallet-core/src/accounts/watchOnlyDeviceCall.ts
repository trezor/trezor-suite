import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { isAccountWatchOnly } from '@suite-common/wallet-utils';
import { type CallMethodPayload } from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect-common';
import { createThunk } from '@trezor/redux-utils';

import { ACCOUNTS_MODULE_PREFIX } from './accountsConstants';
import { type AccountsRootState } from './accountsReducer';
import { selectAccounts } from './accountsSelectors';

// Flows treat it as the user cancelling, so they close quietly and leave the toast to explain.
export const WATCH_ONLY_DEVICE_CALL_ERROR = { error: 'tx-cancelled', code: 'Method_Cancel' };

// Connect also takes a path as numbers, so compare the serialized form.
const serializePath = (path: unknown) => {
    if (typeof path !== 'string' && !Array.isArray(path)) return undefined;

    try {
        return getSerializedPath(validatePath(path));
    } catch {
        return undefined;
    }
};

const getRequestedPaths = (params: CallMethodPayload): (string | undefined)[] => {
    const { path, bundle } = params as { path?: unknown; bundle?: unknown };
    const bundlePaths = Array.isArray(bundle)
        ? bundle.map((item: { path?: unknown } | undefined) => item?.path)
        : [];

    return [path, ...bundlePaths].map(serializePath);
};

export const findWatchOnlyAccountForDeviceCall = (
    accounts: Account[],
    params: CallMethodPayload,
) => {
    const paths = getRequestedPaths(params);

    return accounts.find(account => isAccountWatchOnly(account) && paths.includes(account.path));
};

// Everything the device would have received, without saying which device that is.
const serializeDeviceCall = ({
    device: _device,
    ...params
}: CallMethodPayload & { device?: unknown }) =>
    JSON.stringify(
        params,
        (_key, value: unknown) => (typeof value === 'bigint' ? value.toString() : value),
        2,
    );

export const selectWatchOnlyAccountForDeviceCall = (
    state: AccountsRootState,
    params: CallMethodPayload,
) => findWatchOnlyAccountForDeviceCall(selectAccounts(state), params);

/**
 * The device does not hold the key of a watch-only account, so a call for one never reaches it.
 * This offers the data it would have received for debugging instead.
 */
export const notifyWatchOnlyDeviceCallThunk = createThunk<
    void,
    { params: CallMethodPayload },
    void
>(`${ACCOUNTS_MODULE_PREFIX}/notifyWatchOnlyDeviceCall`, ({ params }, { dispatch }) => {
    dispatch(
        notificationsActions.addToast({
            type: 'watch-only-device-call',
            method: params.method,
            payload: serializeDeviceCall(params),
        }),
    );
});
