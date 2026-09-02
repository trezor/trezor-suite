import { useCallback } from 'react';

import { useDevice } from '@suite/device';
import { useDispatch } from '@suite-common/redux-utils';
import { type YieldFlowType, yieldActions } from '@suite-common/wallet-core';

import { ensureDeviceSession } from './ensureDeviceSession';

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
        const result = await ensureDeviceSession(device);

        if (result.success) {
            return true;
        }

        if (result.error) {
            dispatch(
                yieldActions.setError({
                    flowType,
                    flowKey,
                    error: result.error,
                }),
            );
        }

        return false;
    }, [device, dispatch, flowType, flowKey]);
};
