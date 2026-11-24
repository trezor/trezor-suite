import { useCallback, useLayoutEffect, useRef } from 'react';

import {
    MODAL_CONTEXT_NONE,
    beginStakingDeviceCheck,
    endStakingDeviceCheck,
    selectModal,
} from '@suite/modal';
import { selectAccountSigningDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { useDeviceReadyGuardWithToast } from '#src/hooks/wallet/useDeviceReadyGuardWithToast';

export const useStakingDeviceAction = (account: Account | undefined) => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const ensureDeviceReady = useDeviceReadyGuardWithToast(account?.deviceState);
    const pending = useRef<{ id: string; hasModal: boolean } | undefined>(undefined);

    // A pending reconnect or PIN prompt belongs to the form that opened it.
    useLayoutEffect(
        () => () => {
            if (pending.current?.hasModal)
                dispatch(endStakingDeviceCheck({ id: pending.current.id, abandoned: true }));
            pending.current = undefined;
        },
        [account?.key, dispatch],
    );

    return useCallback(
        async (
            action: (device: TrezorDevice) => unknown,
            beforeDeviceCheck?: () => Promise<void>,
        ) => {
            if (!account || pending.current) return;

            const modal = selectModal(getState());
            if (modal.stakingDeviceCheck) return;

            const begin = beginStakingDeviceCheck();
            const request = { id: begin.payload, hasModal: modal.context !== MODAL_CONTEXT_NONE };
            pending.current = request;
            if (request.hasModal) dispatch(begin);
            try {
                let ready: boolean;
                try {
                    if (beforeDeviceCheck) {
                        await beforeDeviceCheck();
                        if (
                            pending.current !== request ||
                            (request.hasModal &&
                                selectModal(getState()).stakingDeviceCheck?.id !== request.id)
                        )
                            return;
                    }
                    ready = await ensureDeviceReady();
                    if (
                        request.hasModal &&
                        selectModal(getState()).stakingDeviceCheck?.id !== request.id
                    )
                        return;
                } finally {
                    if (request.hasModal) dispatch(endStakingDeviceCheck({ id: request.id }));
                }
                if (!ready || pending.current !== request) return;

                const device = selectAccountSigningDevice(getState(), account.deviceState);
                if (!device) return;

                // A review retry can cancel a signature that is still settling.
                if (beforeDeviceCheck) pending.current = undefined;
                await action(device);
            } catch {
                // Connect errors may include account data.
                console.warn('Staking action failed');
            } finally {
                if (pending.current === request) pending.current = undefined;
            }
        },
        [account, dispatch, ensureDeviceReady, getState],
    );
};
