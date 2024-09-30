import { useState, useCallback, useEffect } from 'react';

import { Column, Markdown, NewModal, Paragraph } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { download } from 'src/actions/suite/desktopUpdateActions';

import { Changelog } from './changelogComponents';

interface AvailableProps {
    onCancel: () => void;
}

export const JustUpdated = ({ onCancel }: AvailableProps) => {
    const [changelog, setChangelog] = useState<string | null>(null);

    const dispatch = useDispatch();

    const downloadUpdate = () => {
        dispatch(download());
        desktopApi.downloadUpdate();
    };

    const suiteCurrentVersion = process.env.VERSION || '';

    const getReleaseNotes = useCallback(async () => {
        const releaseNotesPath = process.env.ASSET_PREFIX + '/release-notes.md';
        const result = await (await fetch(releaseNotesPath)).text();
        setChangelog(result);
    }, []);

    useEffect(() => {
        getReleaseNotes();
    }, [getReleaseNotes]);

    // TODO: once opened just-updates is dismissed

    return (
        <NewModal
            heading={
                <Paragraph typographyStyle="titleSmall" variant="primary">
                    <Translation
                        id="TR_VERSION_HAS_RELEASED"
                        values={{ version: suiteCurrentVersion }}
                    />
                </Paragraph>
            }
            description={<Translation id="TR_UPDATE_MODAL_WHATS_NEW" />}
            onCancel={onCancel}
            bottomContent={
                <>
                    <NewModal.Button onClick={downloadUpdate} variant="primary">
                        <Translation id="TR_GOT_IT" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.xs} alignItems="start">
                <Changelog>
                    {changelog !== null ? (
                        <Markdown>{changelog}</Markdown>
                    ) : (
                        <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                    )}
                </Changelog>
            </Column>
        </NewModal>
    );
};
