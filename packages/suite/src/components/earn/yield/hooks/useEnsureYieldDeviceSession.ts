import { useCallback } from 'react';

import { useDevice } from '@suite/device';
import { type YieldFlowType, stablecoinYieldActions } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';

type UseEnsureYieldDeviceSessionParams = {
    flowType: YieldFlowType;
    flowKey: string;
};

export const useEnsureYieldDeviceSession = ({
    flowType,
    flowKey,
}: UseEnsureYieldDeviceSessionParams) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    return useCallback(async (): Promise<boolean> => {
        if (!device?.state?.staticSessionId) {
            dispatch(
                stablecoinYieldActions.setError({
                    flowType,
                    flowKey,
                    errorCode: 'missing-device-session',
                }),
            );

            return false;
        }

        const response = await TrezorConnect.getDeviceState({
            device: {
                path: device.path,
                instance: device.instance,
                state: { staticSessionId: device.state.staticSessionId },
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
        });

        if (response.success) {
            return true;
        }

        const { code } = response.error;
        if (code === 'Failure_ActionCancelled' || code === 'Method_Cancel') {
            return false;
        }

        dispatch(
            stablecoinYieldActions.setError({
                flowType,
                flowKey,
                errorCode: code ?? 'device-state-failed',
            }),
        );

        return false;
    }, [device, dispatch, flowType, flowKey]);
};
