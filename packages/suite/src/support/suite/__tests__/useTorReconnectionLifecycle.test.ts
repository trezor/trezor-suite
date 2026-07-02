import { act, renderHook } from '@testing-library/react';

import { TorStatus } from '@suite/tor';

import { useTorReconnectionLifecycle } from '../useTorReconnectionLifecycle';

describe(useTorReconnectionLifecycle.name, () => {
    const renderUseTorReconnectionLifecycle = () => {
        const reconnect = jest.fn();
        const disconnect = jest.fn();
        const { result } = renderHook(() => useTorReconnectionLifecycle({ reconnect, disconnect }));

        return {
            disconnect,
            handleTorReconnection: result.current,
            reconnect,
        };
    };

    it('reconnects once for repeated enabled status', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabled });
            handleTorReconnection({ status: TorStatus.Enabled });
        });

        expect(reconnect).toHaveBeenCalledTimes(1);
        expect(reconnect).toHaveBeenCalledWith({ isTorEnabled: true });
        expect(disconnect).not.toHaveBeenCalled();
    });

    it('reconnects once for repeated disabled status', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Disabled });
            handleTorReconnection({ status: TorStatus.Disabled });
        });

        expect(reconnect).toHaveBeenCalledTimes(1);
        expect(reconnect).toHaveBeenCalledWith({ isTorEnabled: false });
        expect(disconnect).not.toHaveBeenCalled();
    });

    it('disconnects once during repeated transition statuses', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabling });
            handleTorReconnection({ status: TorStatus.Enabling });
            handleTorReconnection({ status: TorStatus.Disabling });
            handleTorReconnection({ status: TorStatus.Error });
        });

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(reconnect).not.toHaveBeenCalled();
    });

    it('reconnects after transition even when stable status is unchanged', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabled });
            handleTorReconnection({ status: TorStatus.Enabling });
            handleTorReconnection({ status: TorStatus.Enabled });
        });

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(reconnect).toHaveBeenCalledTimes(2);
        expect(reconnect).toHaveBeenNthCalledWith(1, { isTorEnabled: true });
        expect(reconnect).toHaveBeenNthCalledWith(2, { isTorEnabled: true });
    });

    it('disconnects during disabling and reconnects after disabled status', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Enabled });
            handleTorReconnection({ status: TorStatus.Disabling });
            handleTorReconnection({ status: TorStatus.Disabled });
        });

        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(reconnect).toHaveBeenCalledTimes(2);
        expect(reconnect).toHaveBeenNthCalledWith(1, { isTorEnabled: true });
        expect(reconnect).toHaveBeenNthCalledWith(2, { isTorEnabled: false });
        expect(disconnect.mock.invocationCallOrder[0]).toBeLessThan(
            reconnect.mock.invocationCallOrder[1],
        );
    });

    it('does not reconnect on stable status change without transition status', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Disabled });
            handleTorReconnection({ status: TorStatus.Enabled });
        });

        expect(reconnect).toHaveBeenCalledTimes(1);
        expect(reconnect).toHaveBeenCalledWith({ isTorEnabled: false });
        expect(disconnect).not.toHaveBeenCalled();
    });

    it('does nothing for slow status', () => {
        const { disconnect, handleTorReconnection, reconnect } =
            renderUseTorReconnectionLifecycle();

        act(() => {
            handleTorReconnection({ status: TorStatus.Slow });
        });

        expect(disconnect).not.toHaveBeenCalled();
        expect(reconnect).not.toHaveBeenCalled();
    });
});
