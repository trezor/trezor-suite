import { selectReleaseNotesVersionOverride, suiteSettingsActions } from '@suite/settings';
import {
    ReleaseNotesPlatform,
    fetchReleaseNotesThunk,
    selectReleaseNotesFetchedAt,
    selectReleaseNotesReleases,
} from '@suite-common/release-notes';
import { Button, Row } from '@trezor/components';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

const ACTUAL_VERSION_VALUE = '';

export const ReleaseNotesVersion = () => {
    const versionOverride = useSelector(selectReleaseNotesVersionOverride);
    const releases = useSelector(selectReleaseNotesReleases);
    const fetchedAt = useSelector(selectReleaseNotesFetchedAt);

    const dispatch = useDispatch();

    const actualVersion = process.env.VERSION || 'unknown';
    const options = [
        { label: `Actual version (${actualVersion})`, value: ACTUAL_VERSION_VALUE },
        ...releases.map(release => ({ label: release.version, value: release.version })),
    ];
    const selectedOption =
        options.find(option => option.value === (versionOverride ?? ACTUAL_VERSION_VALUE)) ??
        options[0];

    const handleChange = (item: { value: string }) => {
        dispatch(
            suiteSettingsActions.setDebugMode({
                releaseNotesVersion: item.value === ACTUAL_VERSION_VALUE ? undefined : item.value,
            }),
        );
    };

    const refetch = () =>
        dispatch(
            fetchReleaseNotesThunk({ platform: ReleaseNotesPlatform.Desktop, isForced: true }),
        );

    return (
        <SectionItem data-testid="@settings/debug/release-notes-version">
            <TextColumn
                title="Release notes version"
                description={`Pretend the app runs an older version, to check how the release notes list and the update prompt behave. Manifest last fetched: ${
                    fetchedAt === null ? 'never' : new Date(fetchedAt).toLocaleString()
                }.`}
            />
            <ActionColumn>
                <Row gap={8}>
                    <ActionSelect
                        onChange={handleChange}
                        value={selectedOption}
                        options={options}
                        data-testid="@settings/debug/release-notes-version/select"
                    />
                    <Button intent="neutral" priority="secondary" onClick={refetch}>
                        Refetch
                    </Button>
                </Row>
            </ActionColumn>
        </SectionItem>
    );
};
