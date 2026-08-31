import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useDevice } from '@suite/device';
import { type YieldFlowType, stablecoinYieldActions } from '@suite-common/wallet-core';

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
                stablecoinYieldActions.setError({
                    flowType,
                    flowKey,
                    error: result.error,
                }),
            );
        }

        return false;
    }, [device, dispatch, flowType, flowKey]);
};
