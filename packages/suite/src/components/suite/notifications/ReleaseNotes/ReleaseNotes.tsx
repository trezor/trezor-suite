import { Translation } from '@suite/intl';
import { Banner, Card, Column } from '@trezor/components';

import { ReleaseNoteCard } from './ReleaseNoteCard';
import { useReleaseNotes } from './useReleaseNotes';

export const ReleaseNotes = () => {
    const { releases, updatableRelease, isLoading, hasFailed } = useReleaseNotes();

    if (isLoading) {
        return <Banner isLoading description={<Translation id="TR_RELEASE_NOTES_LOADING" />} />;
    }

    if (hasFailed || releases.length === 0) {
        return (
            <Card>
                <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
            </Card>
        );
    }

    return (
        <Column gap={16}>
            {releases.map(release => (
                <ReleaseNoteCard
                    key={release.version}
                    version={release.version}
                    publishedAt={release.publishedAt}
                    notes={release.notes}
                    isCurrent={release.isCurrent}
                    isUpdatable={release.version === updatableRelease?.version}
                />
            ))}
        </Column>
    );
};
