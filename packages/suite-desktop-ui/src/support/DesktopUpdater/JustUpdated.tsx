import { useCallback, useEffect, useState } from 'react';

import { useTheme } from 'styled-components';

import { Card, NewModal, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { MarkdownWithComponents, Translation, TrezorLink } from 'src/components/suite';
import { getReleaseUrl } from 'src/services/github';

interface AvailableProps {
    onCancel: () => void;
}

export const JustUpdated = ({ onCancel }: AvailableProps) => {
    const [changelog, setChangelog] = useState<string | null>(null);
    const theme = useTheme();
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
        <NewModal
            heading={
                <Translation
                    id="TR_VERSION_HAS_BEEN_RELEASED"
                    values={{ version: suiteCurrentVersion }}
                />
            }
            onCancel={onCancel}
            bottomContent={
                <>
                    <NewModal.Button onClick={onCancel} variant="primary">
                        <Translation id="TR_GOT_IT" />
                    </NewModal.Button>
                </>
            }
        >
            <Card
                overflow="auto"
                label={
                    <Row justifyContent="space-between" gap={spacings.xs}>
                        <Translation id="TR_UPDATE_MODAL_WHATS_NEW" />
                        <TrezorLink
                            href={getReleaseUrl(suiteCurrentVersion)}
                            typographyStyle="hint"
                            color={theme.textSubdued}
                        >
                            <Translation id="TR_CHANGELOG_ON_GITHUB" />
                        </TrezorLink>
                    </Row>
                }
            >
                {changelog !== null ? (
                    <MarkdownWithComponents>{changelog}</MarkdownWithComponents>
                ) : (
                    <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                )}
            </Card>
        </NewModal>
    );
};
