import { useCallback, useMemo } from 'react';

import { type UiEventAction, defaultTrezorUIEventHandlerThunk } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { createConnect } from '@trezor/connect-flow';

import { useDispatch } from './useDispatch';

type Connect = ReturnType<typeof createConnect>;

type DrivableProcess = {
    run: () => AsyncIterableIterator<{ originalEvent: UiEventAction }>;
};

export const useConnect = (): {
    connect: Connect;
    run: (proc: DrivableProcess) => Promise<void>;
} => {
    const dispatch = useDispatch();
    const connect = useMemo(() => createConnect({ trezorConnect: TrezorConnect }), []);

    const run = useCallback(
        async (proc: DrivableProcess) => {
            for await (const subprocess of proc.run()) {
                dispatch(defaultTrezorUIEventHandlerThunk(subprocess.originalEvent));
            }
        },
        [dispatch],
    );

    return { connect, run };
};
