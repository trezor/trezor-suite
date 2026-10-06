import { type TorRootState } from '@suite/tor';
import { TorStatus } from '@suite/tor-types';

import { setTorBootstrapSlowThunk } from './setTorBootstrapSlowThunk';

const createState = (torBootstrap: TorRootState['tor']['torBootstrap'] = null): TorRootState => ({
    tor: {
        torStatus: TorStatus.Enabling,
        torBootstrap,
    },
});

describe(setTorBootstrapSlowThunk.name, () => {
    it('does nothing when no previous bootstrap exists', () => {
        const dispatch = jest.fn();
        const getState = () => createState(null);

        setTorBootstrapSlowThunk(true)(dispatch, getState);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches toast on first slow transition', () => {
        const dispatch = jest.fn();
        const getState = () => createState({ current: 10, total: 100, isSlow: false });

        setTorBootstrapSlowThunk(true)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ type: 'tor-is-slow' }),
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { current: 10, total: 100, isSlow: true },
            }),
        );
    });

    it('does not dispatch toast when already slow', () => {
        const dispatch = jest.fn();
        const getState = () => createState({ current: 10, total: 100, isSlow: true });

        setTorBootstrapSlowThunk(true)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { current: 10, total: 100, isSlow: true },
            }),
        );
    });

    it('clears isSlow without toast', () => {
        const dispatch = jest.fn();
        const getState = () => createState({ current: 10, total: 100, isSlow: true });

        setTorBootstrapSlowThunk(false)(dispatch, getState);

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { current: 10, total: 100, isSlow: false },
            }),
        );
    });
});
