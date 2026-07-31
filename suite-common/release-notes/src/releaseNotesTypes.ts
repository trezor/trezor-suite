export const ReleaseNotesPlatform = {
    Desktop: 'desktop',
    Mobile: 'mobile',
} as const;

export type ReleaseNotesPlatform = (typeof ReleaseNotesPlatform)[keyof typeof ReleaseNotesPlatform];

export type ReleaseNotesRelease = {
    version: string;
    publishedAt: string;
    notes: string;
};

export type ReleaseNotesManifest = {
    version: number;
    generatedAt: string;
    releases: ReleaseNotesRelease[];
};
