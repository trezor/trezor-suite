import { useCallback, useEffect, useState } from 'react';

import { getReleaseUrl } from '@suite/github';
import { Translation } from '@suite/intl';
import { Card, H4, Modal, Row, TextButton } from '@trezor/components';

import { MarkdownWithComponents } from 'src/components/suite';

interface AvailableProps {
    onCancel: () => void;
}

export const JustUpdated = ({ onCancel }: AvailableProps) => {
    const [changelog, setChangelog] = useState<string | null>(null);
    const suiteCurrentVersion = process.env.VERSION || '';

    const getReleaseNotes = useCallback(async () => {
        const releaseNotesPath = process.env.ASSET_PREFIX + '/release-notes.md';
        const result = await (await fetch(releaseNotesPath)).text();
        setChangelog(result);
    }, []);

    useEffect(() => {
        getReleaseNotes();
    }, [getReleaseNotes]);

    return (
        <Modal
            heading={
                <Translation
                    id="TR_VERSION_HAS_BEEN_RELEASED"
                    values={{ version: suiteCurrentVersion }}
                />
            }
            onCancel={onCancel}
            bottomContent={
                <>
                    <Modal.Button onClick={onCancel}>
                        <Translation id="TR_GOT_IT" />
                    </Modal.Button>
                </>
            }
        >
            <Card
                header={
                    <Row justifyContent="space-between" gap={8}>
                        <H4>
                            <Translation id="TR_UPDATE_MODAL_WHATS_NEW" />
                        </H4>
                        <TextButton
                            href={getReleaseUrl(suiteCurrentVersion)}
                            size="small"
                            intent="neutral"
                        >
                            <Translation id="TR_CHANGELOG_ON_GITHUB" />
                        </TextButton>
                    </Row>
                }
            >
                {changelog !== null ? (
                    <MarkdownWithComponents>{changelog}</MarkdownWithComponents>
                ) : (
                    <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                )}
            </Card>
        </Modal>
    );
};
