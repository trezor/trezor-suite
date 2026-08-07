import { type AnyAction, type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ReleaseNotesRelease } from './releaseNotesTypes';

export type ReleaseNotesState = {
    releases: ReleaseNotesRelease[];
    /** Timestamp of the last successful fetch, `null` when the manifest has never been fetched. */
    fetchedAt: number | null;
    /** `generatedAt` of the stored manifest, used to reject replayed older manifests. */
    generatedAt: string | null;
    status: 'idle' | 'loading' | 'error';
};

export type ReleaseNotesRootState = {
    releaseNotes: ReleaseNotesState;
};

export const releaseNotesInitialState: ReleaseNotesState = {
    releases: [],
    fetchedAt: null,
    generatedAt: null,
    status: 'idle',
};

const releaseNotesSlice = createSlice({
    name: 'releaseNotes',
    initialState: releaseNotesInitialState,
    reducers: {
        fetchStart: (state: ReleaseNotesState) => {
            state.status = 'loading';
        },
        fetchSuccess: (
            state: ReleaseNotesState,
            {
                payload,
            }: PayloadAction<{
                releases: ReleaseNotesRelease[];
                fetchedAt: number;
                generatedAt: string;
            }>,
        ) => {
            state.releases = payload.releases;
            state.fetchedAt = payload.fetchedAt;
            state.generatedAt = payload.generatedAt;
            state.status = 'idle';
        },
        fetchError: (state: ReleaseNotesState) => {
            state.status = 'error';
        },
    },
    extraReducers: builder => {
        // Hack: referencing the storage action type as a literal avoids a dependency on the app package.
        builder.addCase('@storage/load', (state: ReleaseNotesState, action) => {
            const { payload } = action as AnyAction;

            if (payload?.releaseNotes) {
                return { ...state, ...payload.releaseNotes, status: 'idle' };
            }

            return state;
        });
    },
});

export const releaseNotesActions = releaseNotesSlice.actions;
export const releaseNotesReducer = releaseNotesSlice.reducer;

export const selectReleaseNotesReleases = (state: ReleaseNotesRootState) =>
    state.releaseNotes.releases;

export const selectReleaseNotesFetchedAt = (state: ReleaseNotesRootState) =>
    state.releaseNotes.fetchedAt;

export const selectReleaseNotesGeneratedAt = (state: ReleaseNotesRootState) =>
    state.releaseNotes.generatedAt;

export const selectIsReleaseNotesFetchLoading = (state: ReleaseNotesRootState) =>
    state.releaseNotes.status === 'loading';

export const selectHasReleaseNotesFetchFailed = (state: ReleaseNotesRootState) =>
    state.releaseNotes.status === 'error';
