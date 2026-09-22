import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export const LOCK_TYPE = {
    ROUTER: 'router', // restricted route changes, all other actions are possible
    DEVICE: 'device', // restricted device call (TrezorConnect)
    UI: 'ui', // restricted most of the UI actions (buttons, keyboard etc.)
} as const;

export type LockType = (typeof LOCK_TYPE)[keyof typeof LOCK_TYPE];

export type LocksState = Record<LockType, number>;

export type LocksRootState = { locks: LocksState };

/**
 * Provenance of a single acquire/release, attached by the caller for the debug lock inspector.
 * The counters ignore it entirely.
 */
export type LockSource = {
    /** Pairs a release with its acquisition. Releases without it match the oldest hold of the same type. */
    id?: string;
    /** What holds the lock, e.g. `TrezorConnect.discoverAccounts`. */
    origin?: string;
};

export type LockActionMeta = LockSource & { at: number };

export const locksInitialState: LocksState = {
    [LOCK_TYPE.UI]: 0,
    [LOCK_TYPE.ROUTER]: 0,
    [LOCK_TYPE.DEVICE]: 0,
};

const changeLock = (state: LocksState, lock: LockType, enabled: boolean) => {
    state[lock] = Math.max(state[lock] + (enabled ? 1 : -1), 0);
};

const prepareLock = (enabled: boolean, source?: LockSource) => ({
    payload: enabled,
    meta: { ...source, at: Date.now() },
});

export const locksSlice = createSlice({
    name: 'locks',
    initialState: locksInitialState,
    reducers: {
        lockUI: {
            prepare: prepareLock,
            reducer: (state: LocksState, { payload }: PayloadAction<boolean>) => {
                changeLock(state, LOCK_TYPE.UI, payload);
            },
        },
        lockDevice: {
            prepare: prepareLock,
            reducer: (state: LocksState, { payload }: PayloadAction<boolean>) => {
                changeLock(state, LOCK_TYPE.DEVICE, payload);
            },
        },
        lockRouter: {
            prepare: prepareLock,
            reducer: (state: LocksState, { payload }: PayloadAction<boolean>) => {
                changeLock(state, LOCK_TYPE.ROUTER, payload);
            },
        },
    },
});

export const { lockUI, lockDevice, lockRouter } = locksSlice.actions;

export type LockAction =
    ReturnType<typeof lockUI> | ReturnType<typeof lockDevice> | ReturnType<typeof lockRouter>;

export const locksReducer = locksSlice.reducer;

export const selectLocks = (state: LocksRootState) => state.locks;
export const selectIsDeviceLocked = (state: LocksRootState) => !!state.locks[LOCK_TYPE.DEVICE];
export const selectIsDeviceOrUiLocked = (state: LocksRootState) =>
    !!state.locks[LOCK_TYPE.DEVICE] || !!state.locks[LOCK_TYPE.UI];
export const selectIsRouterLocked = (state: LocksRootState) => !!state.locks[LOCK_TYPE.ROUTER];
export const selectIsRouterOrUiLocked = (state: LocksRootState) =>
    !!state.locks[LOCK_TYPE.ROUTER] || !!state.locks[LOCK_TYPE.UI];
