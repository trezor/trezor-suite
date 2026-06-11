import { useCallback, useMemo } from 'react';

import { type UiEventAction } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { createConnect } from '@trezor/connect-flow';

type Connect = ReturnType<typeof createConnect>;

type DrivableProcess = {
    run: () => AsyncIterableIterator<{ originalEvent: UiEventAction }>;
};

export const useConnect = (): {
    connect: Connect;
    run: (proc: DrivableProcess) => Promise<void>;
} => {
    const connect = useMemo(() => createConnect({ trezorConnect: TrezorConnect }), []);

    const run = useCallback(async (proc: DrivableProcess) => {
        for await (const subprocess of proc.run()) {
            void subprocess;
        }
    }, []);

    return { connect, run };
};
