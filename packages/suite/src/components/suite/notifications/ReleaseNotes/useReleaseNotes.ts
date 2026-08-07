import { useCallback, useEffect, useState } from 'react';

import { selectReleaseNotesVersionOverride } from '@suite/settings';
import {
    ReleaseNotesPlatform,
    fetchReleaseNotesThunk,
    getDisplayedReleases,
    getUpdatableRelease,
    selectHasReleaseNotesFetchFailed,
    selectIsReleaseNotesFetchLoading,
    selectReleaseNotesReleases,
} from '@suite-common/release-notes';

import { useDispatch, useSelector } from 'src/hooks/suite';

/** Bundled with the app, so the running version has release notes even when offline. */
const loadBundledReleaseNotes = async () => {
    try {
        const response = await fetch(`${process.env.ASSET_PREFIX ?? ''}/release-notes.md`);

        return response.ok ? await response.text() : null;
    } catch {
        return null;
    }
};

export const useReleaseNotes = () => {
    const remoteReleases = useSelector(selectReleaseNotesReleases);
    const isFetchLoading = useSelector(selectIsReleaseNotesFetchLoading);
    const hasFetchFailed = useSelector(selectHasReleaseNotesFetchFailed);
    const versionOverride = useSelector(selectReleaseNotesVersionOverride);

    const [bundledNotes, setBundledNotes] = useState<string | null>(null);
    const [isBundledNotesLoading, setIsBundledNotesLoading] = useState(true);

    const dispatch = useDispatch();

    // Web and desktop ship as a single release, so both read the desktop manifest.
    const platform = ReleaseNotesPlatform.Desktop;
    const currentVersion = versionOverride || process.env.VERSION || '';

    const loadBundled = useCallback(async () => {
        setBundledNotes(await loadBundledReleaseNotes());
        setIsBundledNotesLoading(false);
    }, []);

    useEffect(() => {
        loadBundled();
    }, [loadBundled]);

    useEffect(() => {
        dispatch(fetchReleaseNotesThunk({ platform }));
    }, [dispatch, platform]);

    const releases = getDisplayedReleases({
        releases: remoteReleases,
        currentVersion,
        currentVersionNotes: bundledNotes,
    });

    return {
        releases,
        currentVersion,
        updatableRelease: getUpdatableRelease({ releases, currentVersion }),
        isLoading: isBundledNotesLoading || (isFetchLoading && releases.length === 0),
        hasFailed: hasFetchFailed && releases.length === 0,
    };
};
