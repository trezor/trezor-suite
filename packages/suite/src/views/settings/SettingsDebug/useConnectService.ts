import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import TrezorConnect from '@trezor/connect';
import {
    type ConnectService,
    type CreateWalletOptions,
    type GetAddressOptions,
    type GetAddressSubProcess,
    type Process,
    type TrezorConnectLike,
    type WalletSubProcess,
    createConnectService,
} from '@trezor/connect-flow';

import { useSelector } from 'src/hooks/suite';

export const CONNECT_METHOD = {
    GET_ADDRESS: 'getAddress',
    CREATE_WALLET: 'createWallet',
} as const;

export type ConnectMethod = (typeof CONNECT_METHOD)[keyof typeof CONNECT_METHOD];

type MethodSubProcess<M extends ConnectMethod> = M extends 'getAddress'
    ? GetAddressSubProcess
    : M extends 'createWallet'
      ? WalletSubProcess
      : never;

type MethodOptions<M extends ConnectMethod> = M extends 'getAddress'
    ? Omit<GetAddressOptions, 'devicePath'>
    : M extends 'createWallet'
      ? Omit<CreateWalletOptions, 'devicePath'>
      : never;

type MethodProcess<M extends ConnectMethod> = Process<MethodSubProcess<M>>;

type SubprocessCallback<M extends ConnectMethod> = (subprocess: MethodSubProcess<M>) => void;

interface UseConnectServiceResult<M extends ConnectMethod> {
    connectService: ConnectService;
    process: MethodProcess<M> | null;
    subprocess: MethodSubProcess<M> | null;
    devicePath: string | undefined;
    start: (options: MethodOptions<M>, onSubprocess?: SubprocessCallback<M>) => MethodProcess<M>;
    cancel: () => void;
}

const createProcess = <M extends ConnectMethod>(
    service: ConnectService,
    method: M,
    options: MethodOptions<M>,
    devicePath: string | undefined,
): MethodProcess<M> => {
    if (method === CONNECT_METHOD.GET_ADDRESS) {
        return service.getAddress({
            ...(options as Omit<GetAddressOptions, 'devicePath'>),
            devicePath,
        }) as MethodProcess<M>;
    }
    if (method === CONNECT_METHOD.CREATE_WALLET) {
        if (!devicePath) {
            throw new Error('No device selected — cannot start createWallet');
        }

        return service.createWallet({
            ...(options as Omit<CreateWalletOptions, 'devicePath'>),
            devicePath,
        }) as MethodProcess<M>;
    }
    throw new Error(`Unknown connect method: ${method}`);
};

export const useConnectService = <M extends ConnectMethod>(
    method: M,
): UseConnectServiceResult<M> => {
    const device = useSelector(selectSelectedDevice);
    const devicePath = device?.path;

    const connectService = useMemo(
        () =>
            createConnectService({
                trezorConnect: TrezorConnect as unknown as TrezorConnectLike,
            }),
        [],
    );

    const [process, setProcess] = useState<MethodProcess<M> | null>(null);
    const [subprocess, setSubprocess] = useState<MethodSubProcess<M> | null>(null);
    const procRef = useRef<MethodProcess<M> | null>(null);

    // Cancel any in-flight process when the component unmounts so we don't
    // leak the TrezorConnect listener.
    useEffect(
        () => () => {
            procRef.current?.cancel();
        },
        [],
    );

    const drive = useCallback(
        async (proc: MethodProcess<M>, onSubprocess?: SubprocessCallback<M>) => {
            procRef.current = proc;
            setProcess(proc);
            setSubprocess(null);
            try {
                for await (const next of proc.run()) {
                    setSubprocess(next);
                    onSubprocess?.(next);
                }
            } finally {
                if (procRef.current === proc) {
                    procRef.current = null;
                    setProcess(null);
                    setSubprocess(null);
                }
            }
        },
        [],
    );

    const start = useCallback(
        (options: MethodOptions<M>, onSubprocess?: SubprocessCallback<M>) => {
            const proc = createProcess(connectService, method, options, devicePath);
            void drive(proc, onSubprocess);

            return proc;
        },
        [connectService, method, devicePath, drive],
    );

    const cancel = useCallback(() => {
        procRef.current?.cancel();
    }, []);

    return { connectService, process, subprocess, devicePath, start, cancel };
};
