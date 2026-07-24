import { useCallback, useEffect, useState } from 'react';

import { getReleaseUrl } from '@suite/github';
import { Translation } from '@suite/intl';
import { Badge, Banner, Card, Paragraph, Row, TextButton } from '@trezor/components';

import { MarkdownWithComponents } from 'src/components/suite';

type State = { status: 'loading' } | { status: 'loaded'; changelog: string } | { status: 'error' };

type ReleaseHeaderProps = {
    version: string;
};

const ReleaseHeader = ({ version }: ReleaseHeaderProps) => (
    <Row gap={12} alignItems="center">
        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation id="TR_RELEASE_NOTES_VERSION" />
        </Paragraph>
        <Badge intent="neutral" size="small">
            {version}
        </Badge>
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
    const suiteCurrentVersion = process.env.VERSION || '';

    const loadLocalChangelog = useCallback(async () => {
        try {
            const response = await fetch((process.env.ASSET_PREFIX ?? '') + '/release-notes.md');
            if (!response.ok) {
                setState({ status: 'error' });

                return;
            }
            setState({ status: 'loaded', changelog: await response.text() });
        } catch {
            setState({ status: 'error' });
        }
    }, []);

    useEffect(() => {
        loadLocalChangelog();
    }, [loadLocalChangelog]);

    if (state.status === 'loading') {
        return <Banner isLoading description={<Translation id="TR_RELEASE_NOTES_LOADING" />} />;
    }

    if (state.status === 'error') {
        return (
            <Card>
                <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
            </Card>
        );
    }

    return (
        <Card
            header={<ReleaseHeader version={suiteCurrentVersion} />}
            footer={<GithubFooter url={getReleaseUrl(suiteCurrentVersion)} />}
        >
            <MarkdownWithComponents>{state.changelog}</MarkdownWithComponents>
        </Card>
    );
};
