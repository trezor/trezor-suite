import { type ActionCreatorWithPreparedPayload } from '@reduxjs/toolkit';

// Structurally mirrors `LockSource`/`LockActionMeta` in `@suite/locks`, which app layers own and
// this package must not import. The signature was already restated here for the same reason.
type LockSource = {
    id?: string;
    origin?: string;
};

export type LockDeviceDep = {
    lockDevice: ActionCreatorWithPreparedPayload<
        [payload: boolean, source?: LockSource],
        boolean,
        string,
        never,
        LockSource & { at: number }
    >;
};
