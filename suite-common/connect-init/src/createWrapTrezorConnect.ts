import { type DeviceRootState, deviceActions, selectSelectedDevice } from '@suite-common/device';
import { type DispatchDep } from '@suite-common/redux-utils';
import { type LockDeviceDep } from '@suite-common/suite-types';
import TrezorConnect, { type CallMethodPayload } from '@trezor/connect';
import { getSynchronize, isArrayMember } from '@trezor/utils';

import { blacklist } from './blacklist';

export type WrapTrezorConnectDeps = DispatchDep &
    LockDeviceDep & {
        getState: () => DeviceRootState;
    };

export type WrapTrezorConnect = () => void;

export const createWrapTrezorConnect =
    (deps: WrapTrezorConnectDeps): WrapTrezorConnect =>
    () => {
        const synchronize = getSynchronize();

        const original = TrezorConnect.call.bind(TrezorConnect);
        TrezorConnect.call = async (params: CallMethodPayload) => {
            if (isArrayMember(params.method, blacklist)) {
                return original(params);
            }

            deps.lockDevice(true);

            const result = await synchronize(() => original(params));

            deps.lockDevice(false);
            deps.dispatch(
                deviceActions.removeButtonRequests({
                    // todo: device not 'thread safe' - meaning that device to which button requests have been added to might not
                    // be the same re-selected device from this line. We should reuse device from params.
                    device: selectSelectedDevice(deps.getState()),
                }),
            );

            return result;
        };
    };
