import { getReleaseUrl } from '@suite/github';
import { Translation } from '@suite/intl';
import { Badge, Card, Paragraph, Row, TextButton } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { FormattedDate, MarkdownWithComponents } from 'src/components/suite';

import { ReleaseNotesUpdateButton } from './ReleaseNotesUpdateButton';

type ReleaseNoteCardProps = {
    version: string;
    publishedAt: string;
    notes: string;
    isCurrent: boolean;
    isUpdatable: boolean;
};

const GithubFooter = ({ version }: { version: string }) => (
    <TextButton
        href={getReleaseUrl(version)}
        target="_blank"
        intent="neutral"
        priority="secondary"
        size="small"
        isUnderlined
    >
        <Translation id="TR_CHANGELOG_ON_GITHUB" />
    </TextButton>
);

export const ReleaseNoteCard = ({
    version,
    publishedAt,
    notes,
    isCurrent,
    isUpdatable,
}: ReleaseNoteCardProps) => (
    <Card
        header={
            <Row justifyContent="space-between" alignItems="center" gap={12}>
                <Row gap={8} alignItems="center">
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_RELEASE_NOTES_VERSION" />
                    </Paragraph>
                    <Badge intent="neutral" size="small">
                        {version}
                    </Badge>
                    {isCurrent && (
                        <Badge intent="info" size="small">
                            <Translation id="TR_RELEASE_NOTES_YOUR_VERSION" />
                        </Badge>
                    )}
                </Row>
                <Row gap={12} alignItems="center">
                    {!!publishedAt && (
                        <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                            <FormattedDate value={publishedAt} date />
                        </Paragraph>
                    )}
                    {isUpdatable && isDesktop() && <ReleaseNotesUpdateButton />}
                </Row>
            </Row>
        }
        footer={<GithubFooter version={version} />}
    >
        <MarkdownWithComponents>{notes}</MarkdownWithComponents>
    </Card>
);
