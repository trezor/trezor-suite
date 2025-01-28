import { useState } from 'react';

import { Button } from '@trezor/components';

import { exportMetadataToLocalFile } from 'src/actions/suite/metadataActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const Metadata = () => {
    const dispatch = useDispatch();
    const [exporting, setExporting] = useState(false);

    const onClick = () => {
        setExporting(true);
        dispatch(exportMetadataToLocalFile()).finally(() => {
            setExporting(false);
        });
    };

    return (
        <SectionItem data-testid="@settings/debug/metadata">
            <TextColumn
                title="Export"
                description="Export labeling files to your computer. You may use this to transfer your labeling files from your Google drive account to your Dropbox account."
            />
            <ActionColumn>
                <Button onClick={onClick} isDisabled={exporting} isLoading={exporting}>
                    Export
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
