import { useCallback, useRef } from 'react';

import { TorStatus } from '@suite/tor';
import { exhaustive } from '@trezor/type-utils';

type HandleTorReconnectionParams = {
    status: TorStatus;
};

type ReconnectParams = {
    isTorEnabled: boolean;
};

type ReconnectionState = {
    isDisconnectNeeded: boolean;
    isReconnectNeeded: boolean;
};

export type TorReconnectionLifecycleParams = {
    reconnect: (params: ReconnectParams) => void;
    disconnect: () => void;
};

export const useTorReconnectionLifecycle = ({
    disconnect,
    reconnect,
}: TorReconnectionLifecycleParams) => {
    const state = useRef<ReconnectionState>({
        isDisconnectNeeded: true,
        isReconnectNeeded: true,
    });

    return useCallback(
        ({ status: type }: HandleTorReconnectionParams) => {
            const { isDisconnectNeeded, isReconnectNeeded } = state.current;

            switch (type) {
                case TorStatus.Enabled:
                case TorStatus.Disabled:
                    if (isReconnectNeeded) {
                        reconnect({ isTorEnabled: type === TorStatus.Enabled });
                    }

                    state.current = {
                        isDisconnectNeeded: true,
                        isReconnectNeeded: false,
                    };

                    return;

                case TorStatus.Enabling:
                case TorStatus.Disabling:
                case TorStatus.Error:
                    if (isDisconnectNeeded) {
                        disconnect();
                    }

                    state.current = {
                        isDisconnectNeeded: false,
                        isReconnectNeeded: true,
                    };

                    return;

                case TorStatus.Slow:
                    return;

                default:
                    return exhaustive(type);
            }
        },
        [disconnect, reconnect],
    );
};
