import { type TorRootState } from '@suite/tor';
import { TorStatus } from '@suite/tor-types';

import { setTorBootstrapThunk } from './setTorBootstrapThunk';

const createState = (torBootstrap: TorRootState['tor']['torBootstrap'] = null): TorRootState => ({
    tor: {
        torStatus: TorStatus.Enabling,
        torBootstrap,
    },
});

describe(setTorBootstrapThunk.name, () => {
    it('sets isSlow to false when no previous bootstrap exists', () => {
        const dispatch = jest.fn();
        const getState = () => createState(null);

        setTorBootstrapThunk({ current: 10, total: 100 })(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { current: 10, total: 100, isSlow: false },
            }),
        );
    });

    it('preserves isSlow from previous bootstrap state', () => {
        const dispatch = jest.fn();
        const getState = () => createState({ current: 5, total: 100, isSlow: true });

        setTorBootstrapThunk({ current: 50, total: 100 })(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { current: 50, total: 100, isSlow: true },
            }),
        );
    });

    it('updates current and total from the new payload', () => {
        const dispatch = jest.fn();
        const getState = () => createState({ current: 10, total: 100, isSlow: false });

        setTorBootstrapThunk({ current: 75, total: 200 })(dispatch, getState);

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { current: 75, total: 200, isSlow: false },
            }),
        );
    });
});
