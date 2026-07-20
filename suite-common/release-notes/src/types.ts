export type ReleaseNotesEntry = {
    // Representative full version for the minor line (its highest patch), e.g. "26.8.4".
    version: string;
    // Minor version line the changelog belongs to, e.g. "26.8" (shared by all 26.8.x patches).
    minor: string;
    // ISO date (YYYY-MM-DD) of the representative release for this minor line.
    date: string;
};

export type ReleaseNotesManifest = ReleaseNotesEntry[];
