import { useCallback, useEffect, useState } from 'react';

import { getReleaseUrl } from '@suite/github';
import { Translation } from '@suite/intl';
import {
    type ReleaseNotesEntry,
    type ReleaseNotesManifest,
    sortAndPrune,
    toMinorKey,
} from '@suite-common/release-notes';
import { Badge, Banner, Card, Column, Paragraph, Row, TextButton } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';

import { FormattedDate, MarkdownWithComponents } from 'src/components/suite';

type LoadedEntry = ReleaseNotesEntry & { changelog: string };

type State =
    | { status: 'loading' }
    | { status: 'loaded'; entries: LoadedEntry[] }
    | { status: 'error' };

const RELEASE_NOTES_DIR = 'release-notes';

type ReleaseHeaderProps = {
    version: string;
    date: string;
    isCurrent: boolean;
};

const ReleaseHeader = ({ version, date, isCurrent }: ReleaseHeaderProps) => (
    <Row justifyContent="space-between" alignItems="center" gap={12}>
        <Row gap={12} alignItems="center">
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_RELEASE_NOTES_VERSION" />
            </Paragraph>
            <Badge intent="neutral" size="small">
                {version}
            </Badge>
            {isCurrent && (
                <Badge intent="info" size="small">
                    <Translation id="TR_RELEASE_NOTES_CURRENT" />
                </Badge>
            )}
        </Row>
        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
            {date && <FormattedDate value={date} date />}
        </Paragraph>
    </Row>
);

const GithubFooter = ({ url }: { url: string }) => (
    <TextButton
        href={url}
        target="_blank"
        intent="neutral"
        priority="secondary"
        size="small"
        isUnderlined
    >
        <Translation id="TR_CHANGELOG_ON_GITHUB" />
    </TextButton>
);

export const ReleaseNotes = () => {
    const [state, setState] = useState<State>({ status: 'loading' });
    const currentMinor = toMinorKey(process.env.VERSION || '');

    const loadReleaseNotes = useCallback(async () => {
        try {
            const manifestResponse = await fetch(
                resolveStaticPath(`${RELEASE_NOTES_DIR}/index.json`),
            );
            if (!manifestResponse.ok) {
                setState({ status: 'error' });

                return;
            }

            const manifest = sortAndPrune((await manifestResponse.json()) as ReleaseNotesManifest);
            const entries = await Promise.all(
                manifest.map(async entry => {
                    const response = await fetch(
                        resolveStaticPath(`${RELEASE_NOTES_DIR}/${entry.minor}.md`),
                    );

                    return { ...entry, changelog: response.ok ? await response.text() : '' };
                }),
            );

            setState({ status: 'loaded', entries });
        } catch {
            setState({ status: 'error' });
        }
    }, []);

    useEffect(() => {
        loadReleaseNotes();
    }, [loadReleaseNotes]);

    if (state.status === 'loading') {
        return <Banner isLoading description={<Translation id="TR_RELEASE_NOTES_LOADING" />} />;
    }

    if (state.status === 'error' || state.entries.length === 0) {
        return (
            <Card>
                <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
            </Card>
        );
    }

    return (
        <Column gap={16}>
            {state.entries.map(entry => (
                <Card
                    key={entry.minor}
                    header={
                        <ReleaseHeader
                            version={entry.version}
                            date={entry.date}
                            isCurrent={entry.minor === currentMinor}
                        />
                    }
                    footer={<GithubFooter url={getReleaseUrl(entry.version)} />}
                >
                    <MarkdownWithComponents>{entry.changelog}</MarkdownWithComponents>
                </Card>
            ))}
        </Column>
    );
};
