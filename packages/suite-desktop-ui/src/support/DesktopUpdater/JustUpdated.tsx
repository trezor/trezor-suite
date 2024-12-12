import { useState, useCallback, useEffect } from 'react';

import { Markdown, NewModal, Card } from '@trezor/components';

import { Translation } from 'src/components/suite';

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
                maxHeight={400}
                overflow="auto"
                label={<Translation id="TR_UPDATE_MODAL_WHATS_NEW" />}
            >
                {changelog !== null ? (
                    <Markdown>{changelog}</Markdown>
                ) : (
                    <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                )}
            </Card>
        </NewModal>
    );
};
