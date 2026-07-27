import { act, renderHook } from '@testing-library/react';

import { TorStatus } from '@suite/tor';
import { mock } from '@suite-common/dependency-injection';

import {
    type TorReconnectionLifecycleParams,
    useTorReconnectionLifecycle,
} from '../useTorReconnectionLifecycle';

describe(useTorReconnectionLifecycle.name, () => {
    type Disconnect = TorReconnectionLifecycleParams['disconnect'];
    type Reconnect = TorReconnectionLifecycleParams['reconnect'];
    type CallSequence = Array<'disconnect' | 'reconnect-clearnet' | 'reconnect-tor'>;

    const renderUseTorReconnectionLifecycle = () => {
        const callSequence: CallSequence = [];
        const reconnect = mock<Reconnect>(params =>
            callSequence.push(params.isTorEnabled ? 'reconnect-tor' : 'reconnect-clearnet'),
        );
        const disconnect = mock<Disconnect>(() => callSequence.push('disconnect'));
        const { result } = renderHook(() => useTorReconnectionLifecycle({ reconnect, disconnect }));

        return {
            callSequence,
            handleTorReconnection: result.current,
        };
    };

    it('reconnects once for repeated enabled status', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabled });
            handleTorReconnection({ status: TorStatus.Enabled });
        });

        expect(callSequence).toEqual(['reconnect-tor']);
    });

    it('reconnects once for repeated disabled status', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Disabled });
            handleTorReconnection({ status: TorStatus.Disabled });
        });

        expect(callSequence).toEqual(['reconnect-clearnet']);
    });

    it('disconnects once during repeated transition statuses', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabling });
            handleTorReconnection({ status: TorStatus.Enabling });
            handleTorReconnection({ status: TorStatus.Disabling });
            handleTorReconnection({ status: TorStatus.Error });
        });

        expect(callSequence).toEqual(['disconnect']);
    });

    it('reconnects after transition even when stable status is unchanged', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabled });
            handleTorReconnection({ status: TorStatus.Enabling });
            handleTorReconnection({ status: TorStatus.Enabled });
        });

        expect(callSequence).toEqual(['reconnect-tor', 'disconnect', 'reconnect-tor']);
    });

    it('disconnects during disabling and reconnects after disabled status', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabled });
            handleTorReconnection({ status: TorStatus.Disabling });
            handleTorReconnection({ status: TorStatus.Disabled });
        });

        expect(callSequence).toEqual(['reconnect-tor', 'disconnect', 'reconnect-clearnet']);
    });

    it('does not reconnect on stable status change without transition status', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Disabled });
            handleTorReconnection({ status: TorStatus.Enabled });
        });

        expect(callSequence).toEqual(['reconnect-clearnet']);
    });

    it('does nothing for slow status', () => {
        const { callSequence, handleTorReconnection } = renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Slow });
        });

        expect(callSequence).toEqual([]);
    });
});
